-- Create table for scheduled reports
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  time TIME NOT NULL DEFAULT '09:00:00',
  email_recipients TEXT[] NOT NULL DEFAULT '{}',
  report_format TEXT NOT NULL DEFAULT 'pdf' CHECK (report_format IN ('pdf', 'excel', 'csv')),
  filters JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  next_run_date TIMESTAMP WITH TIME ZONE,
  last_run_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_day_configuration CHECK (
    (frequency = 'weekly' AND day_of_week IS NOT NULL AND day_of_month IS NULL) OR
    (frequency = 'monthly' AND day_of_month IS NOT NULL AND day_of_week IS NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scheduled reports" 
ON public.scheduled_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled reports" 
ON public.scheduled_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled reports" 
ON public.scheduled_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled reports" 
ON public.scheduled_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for scheduled report execution history
CREATE TABLE public.scheduled_report_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_report_id UUID NOT NULL REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  error_message TEXT,
  file_path TEXT,
  file_size INTEGER,
  execution_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for execution history
ALTER TABLE public.scheduled_report_executions ENABLE ROW LEVEL SECURITY;

-- Create policy for execution history (users can view executions for their own scheduled reports)
CREATE POLICY "Users can view executions for their own scheduled reports" 
ON public.scheduled_report_executions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.scheduled_reports sr 
    WHERE sr.id = scheduled_report_id AND sr.user_id = auth.uid()
  )
);

-- Create function to calculate next run date
CREATE OR REPLACE FUNCTION public.calculate_next_run_date(
  frequency TEXT,
  day_of_week INTEGER,
  day_of_month INTEGER,
  run_time TIME,
  from_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_date TIMESTAMP WITH TIME ZONE;
  current_date_part DATE;
  time_part TIME;
BEGIN
  current_date_part := from_date::DATE;
  time_part := run_time;
  
  IF frequency = 'weekly' THEN
    -- Calculate next occurrence of the specified day of week
    next_date := current_date_part + (day_of_week - EXTRACT(DOW FROM current_date_part))::INTEGER;
    
    -- If the calculated date is today but the time has passed, move to next week
    IF next_date::DATE = current_date_part AND (current_date_part + time_part) <= from_date THEN
      next_date := next_date + INTERVAL '7 days';
    END IF;
    
    -- If the calculated date is in the past, move to next week
    IF next_date::DATE < current_date_part THEN
      next_date := next_date + INTERVAL '7 days';
    END IF;
    
  ELSIF frequency = 'monthly' THEN
    -- Calculate next occurrence of the specified day of month
    next_date := DATE_TRUNC('month', current_date_part) + (day_of_month - 1) * INTERVAL '1 day';
    
    -- If the calculated date is today but the time has passed, or if it's in the past, move to next month
    IF next_date::DATE <= current_date_part AND (next_date::DATE < current_date_part OR (current_date_part + time_part) <= from_date) THEN
      next_date := DATE_TRUNC('month', current_date_part + INTERVAL '1 month') + (day_of_month - 1) * INTERVAL '1 day';
    END IF;
    
    -- Handle months with fewer days (e.g., requesting day 31 in February)
    WHILE EXTRACT(DAY FROM next_date) != day_of_month LOOP
      next_date := DATE_TRUNC('month', next_date + INTERVAL '1 month') + (day_of_month - 1) * INTERVAL '1 day';
    END LOOP;
  END IF;
  
  -- Combine date and time
  RETURN next_date::DATE + time_part;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate next_run_date
CREATE OR REPLACE FUNCTION public.update_scheduled_report_next_run()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_run_date := public.calculate_next_run_date(
    NEW.frequency,
    NEW.day_of_week,
    NEW.day_of_month,
    NEW.time
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduled_report_next_run_trigger
  BEFORE INSERT OR UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scheduled_report_next_run();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on executions table
CREATE TRIGGER update_scheduled_report_executions_updated_at
  BEFORE UPDATE ON public.scheduled_report_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
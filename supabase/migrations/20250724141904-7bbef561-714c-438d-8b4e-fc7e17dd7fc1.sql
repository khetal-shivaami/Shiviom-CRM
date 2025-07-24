-- Fix security issues by setting search_path for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Update trigger function with search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Update update function with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
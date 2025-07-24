-- Create tasks table with comprehensive structure
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'overdue')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('customer-outreach', 'partner-onboarding', 'renewal-follow-up', 'training', 'technical-support', 'follow-up', 'meeting', 'document-review', 'approval', 'negotiation', 'onboarding', 'support', 'other')),
  
  -- Assignment and relationships
  assigned_to UUID REFERENCES public.profiles(user_id),
  assigned_by UUID REFERENCES public.profiles(user_id),
  customer_id UUID REFERENCES public.customers(id),
  partner_id UUID REFERENCES public.partners(id),
  
  -- Onboarding specific fields
  is_onboarding_task BOOLEAN DEFAULT false,
  onboarding_stage TEXT CHECK (onboarding_stage IS NULL OR onboarding_stage IN ('outreach', 'product-overview', 'partner-program', 'kyc', 'agreement', 'onboarded')),
  stage_requirement BOOLEAN DEFAULT false,
  auto_generated BOOLEAN DEFAULT false,
  
  -- Dates and metadata
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Task details
  notes TEXT,
  tags TEXT[],
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2)
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view tasks assigned to them" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = assigned_to);

CREATE POLICY "Users can view tasks they created" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = assigned_by);

CREATE POLICY "Managers can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'manager'::text, 'assistant-manager'::text]));

CREATE POLICY "Users can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Users can update their assigned tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = assigned_to OR auth.uid() = assigned_by OR get_current_user_role() = ANY (ARRAY['admin'::text, 'manager'::text, 'assistant-manager'::text]));

CREATE POLICY "Managers can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'manager'::text, 'assistant-manager'::text]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create onboarding tasks when partner stage changes
CREATE OR REPLACE FUNCTION public.create_onboarding_tasks()
RETURNS TRIGGER AS $$
DECLARE
  stage_tasks TEXT[];
  task_title TEXT;
  task_description TEXT;
  assigned_user UUID;
BEGIN
  -- Only proceed if this is a stage change
  IF OLD.onboarding_stage IS DISTINCT FROM NEW.onboarding_stage THEN
    -- Define tasks for each stage
    CASE NEW.onboarding_stage
      WHEN 'outreach' THEN
        stage_tasks := ARRAY[
          'Initial contact and introduction',
          'Schedule product overview meeting',
          'Send welcome package and materials'
        ];
      WHEN 'product-overview' THEN
        stage_tasks := ARRAY[
          'Conduct product demonstration',
          'Provide detailed product documentation',
          'Answer technical questions and requirements'
        ];
      WHEN 'partner-program' THEN
        stage_tasks := ARRAY[
          'Present partner program benefits',
          'Discuss commission structure and terms',
          'Provide partner portal access information'
        ];
      WHEN 'kyc' THEN
        stage_tasks := ARRAY[
          'Collect required KYC documentation',
          'Verify business registration and licenses',
          'Complete compliance checks'
        ];
      WHEN 'agreement' THEN
        stage_tasks := ARRAY[
          'Prepare partnership agreement',
          'Review legal terms and conditions',
          'Obtain signatures and finalize agreement'
        ];
      WHEN 'onboarded' THEN
        stage_tasks := ARRAY[
          'Setup partner portal access',
          'Provide training materials and resources',
          'Schedule follow-up meeting'
        ];
      ELSE
        stage_tasks := ARRAY[]::TEXT[];
    END CASE;

    -- Get a user to assign tasks to (prefer assigned users or default to admin)
    SELECT user_id INTO assigned_user 
    FROM public.profiles 
    WHERE role IN ('admin', 'manager', 'assistant-manager')
    ORDER BY role = 'admin' DESC, role = 'manager' DESC
    LIMIT 1;

    -- Create tasks for the new stage
    FOREACH task_title IN ARRAY stage_tasks
    LOOP
      task_description := 'Auto-generated task for partner ' || NEW.name || ' in ' || NEW.onboarding_stage || ' stage';
      
      INSERT INTO public.tasks (
        title,
        description,
        type,
        priority,
        status,
        assigned_to,
        assigned_by,
        partner_id,
        is_onboarding_task,
        onboarding_stage,
        stage_requirement,
        auto_generated,
        due_date
      ) VALUES (
        task_title,
        task_description,
        'partner-onboarding',
        'medium',
        'pending',
        assigned_user,
        assigned_user,
        NEW.id,
        true,
        NEW.onboarding_stage,
        true,
        true,
        NOW() + INTERVAL '7 days'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create tasks on partner stage change
CREATE TRIGGER create_onboarding_tasks_trigger
AFTER UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.create_onboarding_tasks();
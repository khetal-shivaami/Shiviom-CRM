-- Fix function search path issues for security
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_onboarding_tasks()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
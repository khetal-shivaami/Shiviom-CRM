CREATE TABLE public.partner_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  portal_reseller_id TEXT,
  note TEXT NOT NULL,
  stage TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at_stage TEXT
);

ALTER TABLE public.partner_notes ENABLE ROW LEVEL SECURITY;

-- Allow users to view all notes
CREATE POLICY "Users can view all partner notes"
ON public.partner_notes FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to insert notes they own
CREATE POLICY "Users can insert their own notes"
ON public.partner_notes FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';
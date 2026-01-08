-- Create sample users for testing
-- Note: This creates sample user accounts and their profiles for development/testing purposes

-- Insert sample users into auth.users table using Supabase's auth.users functionality
-- We'll create the profiles first, then you'll need to create the actual auth users in Supabase Dashboard

-- Insert sample profiles (you'll need to create corresponding auth users in Supabase Dashboard)
INSERT INTO public.profiles (user_id, email, first_name, last_name, role, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@shiviom.com', 'Admin', 'User', 'admin', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'manager@shiviom.com', 'Manager', 'User', 'manager', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'user@shiviom.com', 'Regular', 'User', 'user', 'active')
ON CONFLICT (user_id) DO NOTHING;

-- Create a helper function to create sample auth users (for admin use only)
-- This function can be called from the SQL editor in Supabase Dashboard
CREATE OR REPLACE FUNCTION create_sample_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function should be called manually from Supabase SQL editor
  -- It will help create the auth users that correspond to the profiles above
  
  RETURN 'Sample users need to be created manually in Supabase Auth. Use these credentials:
  1. admin@shiviom.com / admin12356 (user_id: 11111111-1111-1111-1111-111111111111)
  2. manager@shiviom.com / manager123 (user_id: 22222222-2222-2222-2222-222222222222)  
  3. user@shiviom.com / user123 (user_id: 33333333-3333-3333-3333-333333333333)
  
  Create these users in Supabase Dashboard > Authentication > Users';
END;
$$;
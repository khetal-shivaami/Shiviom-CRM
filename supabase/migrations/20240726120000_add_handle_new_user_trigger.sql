-- This migration sets up a trigger to automatically create a user profile
-- when a new user is created in the Supabase auth system.

-- 1. Create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, first_name, last_name, role, department, phone, reporting_to, status)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'role',
    new.raw_user_meta_data ->> 'department',
    new.raw_user_meta_data ->> 'phone',
    (new.raw_user_meta_data ->> 'reporting_to')::uuid,
    'active' -- Default status for new users
  );
  return new;
end;
$$;

-- 2. Create a trigger to call the function on new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Grant necessary permissions on the function
grant execute on function public.handle_new_user() to postgres;
grant execute on function public.handle_new_user() to authenticated;
grant execute on function public.handle_new_user() to service_role;
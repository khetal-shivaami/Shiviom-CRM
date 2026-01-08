-- Function to get all module keys for a given user based on their role
create or replace function get_user_module_keys(p_user_id uuid)
returns text[] as $$
declare
  user_role_name text;
  user_role_id uuid;
  module_keys text[];
begin
  -- Get user's role name from profiles table
  select role into user_role_name from public.profiles where user_id = p_user_id;

  if user_role_name is null then
    return array[]::text[];
  end if;

  -- Get role id from roles table
  select id into user_role_id from public.roles where name = user_role_name;

  if user_role_id is null then
    return array[]::text[];
  end if;

  -- Get all module keys for that role
  select array_agg(am.module_key)
  into module_keys
  from public.role_module_permissions rmp
  join public.app_modules am on rmp.module_id = am.id
  where rmp.role_id = user_role_id;

  return coalesce(module_keys, array[]::text[]);
end;
$$ language plpgsql security definer;

-- Grant execute permission to the authenticated role
grant execute on function public.get_user_module_keys(uuid) to authenticated;
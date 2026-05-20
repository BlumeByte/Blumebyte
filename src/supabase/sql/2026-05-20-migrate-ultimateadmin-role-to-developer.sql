-- Canonical platform admin role migration: ultimateadmin -> developer
-- Run this in Supabase SQL editor (or migration pipeline) before removing legacy aliases.

begin;

-- 1) Auth metadata: normalize role in auth.users
update auth.users
set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', '"developer"'::jsonb, true)
where coalesce(raw_user_meta_data ->> 'role', '') = 'ultimateadmin';

update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', '"developer"'::jsonb, true)
where coalesce(raw_app_meta_data ->> 'role', '') = 'ultimateadmin';

-- 2) Common profile tables (if present)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    execute 'update public.profiles set role = ''developer'' where role = ''ultimateadmin''';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'role'
  ) then
    execute 'update public.users set role = ''developer'' where role = ''ultimateadmin''';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'employees' and column_name = 'role'
  ) then
    execute 'update public.employees set role = ''developer'' where role = ''ultimateadmin''';
  end if;
end $$;

commit;

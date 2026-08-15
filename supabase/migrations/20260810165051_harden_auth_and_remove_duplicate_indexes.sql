-- Roles used for authorization must live in server-managed app metadata.
-- Prefer the canonical employee store, then the platform-user stores.
with trusted_roles as (
  select distinct on (user_id) user_id, role
  from (
    select substring(key from position(':' in key) + 1)::uuid as user_id,
           lower(value->>'role') as role,
           1 as priority
    from public.kv_store_a35148f0
    where key like 'employee:%'
      and substring(key from position(':' in key) + 1)
        ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    union all
    select substring(key from position(':' in key) + 1)::uuid,
           lower(value->>'role'),
           2
    from public.kv_store_a35148f0
    where key like 'platform_user:%'
      and substring(key from position(':' in key) + 1)
        ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    union all
    select substring(key from position(':' in key) + 1)::uuid,
           lower(value->>'role'),
           3
    from public.kv_store_a35148f0
    where key like 'customer_care_users:%'
      and substring(key from position(':' in key) + 1)
        ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) candidates
  where role in ('developer', 'customer_care', 'superadmin', 'admin', 'manager', 'employee')
  order by user_id, priority
)
update auth.users as users
set raw_app_meta_data = coalesce(users.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', trusted_roles.role)
from trusted_roles
where users.id = trusted_roles.user_id;

-- The original developer account predates the canonical employee record.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'developer')
where lower(email) = 'cstmrsolution@gmail.com';

-- This RPC can enqueue a privileged webhook and must never be public.
revoke execute on function public.enqueue_make_server_a35148f0(jsonb) from public, anon, authenticated;
grant execute on function public.enqueue_make_server_a35148f0(jsonb) to service_role;

-- Keep one LIKE-optimized index per KV table. Previous setup runs created
-- dozens of byte-for-byte duplicate indexes, slowing every write.
do $$
declare
  duplicate_index record;
begin
  for duplicate_index in
    select schemaname, indexname
    from pg_indexes
    where schemaname = 'public'
      and (
        (tablename = 'kv_store_a35148f0'
          and indexname <> 'idx_kv_store_a35148f0_key_prefix'
          and indexdef like '%(key text_pattern_ops)%')
        or
        (tablename = 'kv_store_668731fc'
          and indexname <> 'kv_store_668731fc_key_idx'
          and indexdef like '%(key text_pattern_ops)%')
      )
  loop
    execute format('drop index if exists %I.%I', duplicate_index.schemaname, duplicate_index.indexname);
  end loop;
end
$$;

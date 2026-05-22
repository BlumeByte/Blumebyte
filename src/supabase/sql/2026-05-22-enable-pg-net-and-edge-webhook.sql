-- Ensure pg_net is available for async HTTP calls from Postgres
create extension if not exists pg_net with schema extensions;

-- Calls the exact edge function on the correct project URL.
-- Use SELECT net.http_post(...) so the request id is captured.
create or replace function public.enqueue_make_server_a35148f0(payload jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id bigint;
begin
  select net.http_post(
    url := 'https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server-a35148f0/webhook',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := coalesce(payload, '{}'::jsonb)
  )
  into request_id;

  return request_id;
end;
$$;

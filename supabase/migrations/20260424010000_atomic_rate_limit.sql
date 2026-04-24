-- Migration: atomic rate-limit check via RPC
-- Date: 2026-04-24
-- Purpose: close TOCTOU race in src/lib/rate-limit/index.ts where two concurrent
--   requests both read count=limit and both increment, bursting through the cap.
--
-- The function performs a single atomic upsert:
--   - If no row exists, insert count=1.
--   - If row exists but its window has expired, reset count=1 and bump window_start.
--   - Otherwise, increment count by 1.
-- Returns (allowed boolean, count int, window_start timestamptz).
-- Callers compare `count <= limit` to decide allow/deny. Because the count is
-- returned from the same atomic statement that incremented it, two concurrent
-- callers at count=limit get distinct post-increment counts (limit+1 and limit+2),
-- and only one sees allowed=true for that transition.

create or replace function public.check_rate_limit(
  p_key text,
  p_type text,
  p_limit integer,
  p_window_ms integer
) returns table (
  allowed boolean,
  new_count integer,
  window_start timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  -- Upsert: insert fresh row or increment existing.
  -- ON CONFLICT uses the (key, type) natural key; if the existing row's
  -- window has aged past p_window_ms, reset it.
  insert into public.rate_limits as rl (key, type, count, window_start)
  values (p_key, p_type, 1, v_now)
  on conflict (key, type)
  do update set
    count = case
      when rl.window_start < v_now - (p_window_ms || ' milliseconds')::interval
        then 1
      else rl.count + 1
    end,
    window_start = case
      when rl.window_start < v_now - (p_window_ms || ' milliseconds')::interval
        then v_now
      else rl.window_start
    end
  returning rl.count, rl.window_start into v_count, v_window_start;

  return query select (v_count <= p_limit), v_count, v_window_start;
end;
$$;

-- Required for ON CONFLICT (key, type) to resolve — confirm unique index exists.
-- (Initial schema already creates this; statement is idempotent.)
create unique index if not exists rate_limits_key_type_idx
  on public.rate_limits (key, type);

-- Grant execute to the service role only. Anon/authenticated roles should
-- never hit this directly — rate limiting is always backend-enforced.
revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer) to service_role;

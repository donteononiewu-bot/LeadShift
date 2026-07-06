-- Replaces the blind increment_buyer_counts with a single atomic
-- check-and-increment: two concurrent leads racing for the same buyer's
-- last remaining slot could otherwise both pass the (separately-fetched,
-- now-stale) cap check and both increment, pushing the buyer over cap.
-- This folds the cap check into the same UPDATE as the increment, so
-- Postgres's row lock makes the whole operation atomic. Returns true if
-- the buyer was claimed, false if a cap was already at/over its limit.
create or replace function try_claim_buyer_capacity(p_buyer_id uuid)
returns boolean
language sql
as $$
  with claimed as (
    update buyers
    set daily_count = daily_count + 1,
        weekly_count = weekly_count + 1,
        monthly_count = monthly_count + 1
    where id = p_buyer_id
      and (daily_cap is null or daily_count < daily_cap)
      and (weekly_cap is null or weekly_count < weekly_cap)
      and (monthly_cap is null or monthly_count < monthly_cap)
    returning id
  )
  select exists (select 1 from claimed);
$$;

-- Restrict these to server-side (service-role) callers only. They mutate
-- buyer/funnel counters outside normal application logic and have no
-- audit trail of their own — an authenticated org member should never be
-- able to invoke them directly via .rpc() from the browser.
revoke execute on function try_claim_buyer_capacity(uuid) from public, anon, authenticated;
revoke execute on function increment_buyer_counts(uuid) from public, anon, authenticated;
revoke execute on function increment_funnel_views(uuid) from public, anon, authenticated;

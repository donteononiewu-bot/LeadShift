-- Atomic single-statement increment so concurrent routing decisions can't
-- race past a buyer's cap between reading and writing its counters.
create or replace function increment_buyer_counts(p_buyer_id uuid)
returns void
language sql
as $$
  update buyers
  set daily_count = daily_count + 1,
      weekly_count = weekly_count + 1,
      monthly_count = monthly_count + 1
  where id = p_buyer_id;
$$;

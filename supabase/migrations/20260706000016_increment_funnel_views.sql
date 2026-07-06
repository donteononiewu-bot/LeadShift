create or replace function increment_funnel_views(p_funnel_id uuid)
returns void
language sql
as $$
  update funnels set views = views + 1 where id = p_funnel_id;
$$;

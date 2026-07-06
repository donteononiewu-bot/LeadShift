-- The routing engine logs one routing_events row even when zero buyers are
-- eligible at all (as opposed to being individually rejected for a reason).
alter type routing_outcome add value if not exists 'no_buyers_matched';

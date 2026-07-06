-- Buyers that passed every eligibility filter but weren't the one the
-- strategy picked previously got no routing_events row at all — only
-- filtered-out buyers and the winner did. This value closes that gap.
alter type routing_outcome add value if not exists 'not_selected';

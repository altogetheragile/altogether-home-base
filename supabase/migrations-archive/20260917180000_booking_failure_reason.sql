-- A booking that failed part way must stop blocking its slot.
--
-- booking-create inserts as pending, then calls Zoom and Google. When one of
-- those failed the row was left pending so an admin could see it. But every
-- non-cancelled row blocks its slot, in the edge function AND in the
-- bookings_no_overlap constraint. So one failed attempt took that time out of
-- circulation for good, and the only cure was cancelling it by hand.
--
-- The fix is to cancel it automatically and say why. 'cancelled' already frees
-- the slot at both layers, so nothing here touches the enum or the exclusion
-- constraint - both of which are awkward to change and easy to get wrong.
--
-- failure_reason is what separates "the system gave up" from "Al cancelled it":
-- null means a person did it, anything else means we did.
alter table bookings add column if not exists failure_reason text;

comment on column bookings.failure_reason is
  'Why booking-create abandoned this booking: zoom, calendar, or timeout. '
  'Null means it was cancelled by a person, not by the system.';

-- Finding the ones that gave up, without scanning every cancellation.
create index if not exists bookings_failure_reason_idx
  on bookings (created_at desc) where failure_reason is not null;

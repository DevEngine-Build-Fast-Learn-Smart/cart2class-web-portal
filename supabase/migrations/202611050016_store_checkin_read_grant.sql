-- RLS already scopes check-in codes to a store member's own location; this grant
-- permits that policy to be evaluated by the Store Portal.
grant select on public.store_checkin_codes to authenticated;

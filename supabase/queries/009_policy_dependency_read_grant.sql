-- classes RLS evaluates a school ownership lookup; authenticated users need this
-- table privilege for the policy expression itself. Row visibility stays under RLS.
grant select on table public.schools to authenticated;

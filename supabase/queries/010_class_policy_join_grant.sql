-- The class visibility policy checks active parent/student links in its predicate.
-- Granting SELECT enables that policy evaluation; RLS still filters every row.
grant select on table public.parent_student_relationships to authenticated;

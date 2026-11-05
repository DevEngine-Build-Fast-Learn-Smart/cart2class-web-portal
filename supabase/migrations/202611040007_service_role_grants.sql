-- Minimal privileges for scripts/create-demo-users.ts only.
-- service_role already bypasses RLS; do not grant DELETE or blanket schema-wide privileges.
grant usage on schema public to service_role;
grant select, insert, update on table
  public.profiles,
  public.role_memberships,
  public.parent_student_relationships,
  public.teacher_class_assignments,
  public.store_memberships,
  public.missions,
  public.mission_versions,
  public.mission_stages,
  public.mission_questions,
  public.mission_assignments,
  public.mission_attempts,
  public.reward_goals,
  public.store_checkin_codes,
  public.notifications
to service_role;

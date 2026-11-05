-- RLS decides which rows authenticated portal users may read. These grants cover
-- only the current login/dashboard queries and never bypass RLS.
grant usage on schema public to authenticated;
grant select on table
  public.profiles,
  public.role_memberships,
  public.classes,
  public.students,
  public.missions,
  public.mission_assignments,
  public.mission_attempts,
  public.reading_recordings,
  public.reward_goals,
  public.notifications
to authenticated;
grant execute on function public.my_store_dashboard() to authenticated;

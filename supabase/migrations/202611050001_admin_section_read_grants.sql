-- Additional read access required by the current administrator section views.
-- Existing RLS policies continue to restrict each row to the authorized organization.
grant select on table
  public.organizations,
  public.stores,
  public.store_memberships,
  public.reward_goals,
  public.mission_reviews
to authenticated;

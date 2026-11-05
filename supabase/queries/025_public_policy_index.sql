-- Public visitors may discover a policy route title, while its body remains hidden
-- until an administrator publishes a version.
create policy "public policy document index" on public.policy_documents for select using (slug in ('privacy-policy','terms-and-conditions','data-deletion','child-safety','acceptable-use','about','contact'));

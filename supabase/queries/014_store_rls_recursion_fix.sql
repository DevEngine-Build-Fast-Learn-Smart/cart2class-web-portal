-- Avoid recursive evaluation between stores and store_memberships RLS policies.
create or replace function public.is_store_org_admin(target_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_org_admin(s.organization_id) from public.stores s where s.id = target_store
$$;

drop policy if exists "users view own store memberships" on public.store_memberships;
create policy "users view own store memberships" on public.store_memberships for select using (
  user_id = auth.uid() or public.is_store_org_admin(store_id)
);
grant execute on function public.is_store_org_admin(uuid) to authenticated;

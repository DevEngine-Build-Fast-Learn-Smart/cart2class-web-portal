-- The original administrator membership policy queried stores directly and created
-- a recursive SELECT path when stores queried memberships. Use a trusted boolean.
create or replace function public.is_store_org_admin(target_store uuid) returns boolean
language sql stable security definer set search_path = public set row_security = off as $$
  select exists(
    select 1 from public.stores s
    where s.id = target_store and public.is_org_admin(s.organization_id)
  )
$$;
drop policy if exists "admins manage store memberships" on public.store_memberships;
create policy "admins manage store memberships" on public.store_memberships for all
  using (public.is_store_org_admin(store_id))
  with check (public.is_store_org_admin(store_id));
grant execute on function public.is_store_org_admin(uuid) to authenticated;

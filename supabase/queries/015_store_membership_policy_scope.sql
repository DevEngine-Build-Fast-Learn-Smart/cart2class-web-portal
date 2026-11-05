-- Store members need only their own membership rows. Administrators access stores
-- and rewards through organization-admin policies, avoiding a recursive join path.
drop policy if exists "users view own store memberships" on public.store_memberships;
create policy "users view own store memberships" on public.store_memberships for select using (
  user_id = auth.uid()
);

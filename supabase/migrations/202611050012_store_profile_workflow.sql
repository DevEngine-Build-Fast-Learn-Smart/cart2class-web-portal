create or replace function public.update_own_store_profile(p_store_id uuid, p_contact_email text, p_address text)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
begin
  if not exists(select 1 from public.store_memberships where user_id=auth.uid() and store_id=p_store_id and is_active) then raise exception 'not authorized to update this store profile'; end if;
  update public.stores set contact_email=nullif(trim(p_contact_email),''), address=nullif(trim(p_address),'') where id=p_store_id;
end $$;
grant execute on function public.update_own_store_profile(uuid,text,text) to authenticated;

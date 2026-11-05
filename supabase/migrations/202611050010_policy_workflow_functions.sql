create or replace function public.publish_policy_version(p_version_id uuid, p_effective_at timestamptz default null)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_document_id uuid;
begin
  if not public.has_role('admin') then raise exception 'not authorized to publish policies'; end if;
  select document_id into v_document_id from public.policy_versions where id=p_version_id;
  if v_document_id is null then raise exception 'Policy version not found'; end if;
  update public.policy_versions set status='unpublished' where document_id=v_document_id and status='published';
  update public.policy_versions set status='published', published_at=now(), effective_at=coalesce(p_effective_at,effective_at) where id=p_version_id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata)
  select rm.organization_id, auth.uid(), 'policy.published', 'policy_version', p_version_id, jsonb_build_object('document_id',v_document_id)
  from public.role_memberships rm where rm.user_id=auth.uid() and rm.role='admin' and rm.is_active limit 1;
end $$;
grant execute on function public.publish_policy_version(uuid,timestamptz) to authenticated;

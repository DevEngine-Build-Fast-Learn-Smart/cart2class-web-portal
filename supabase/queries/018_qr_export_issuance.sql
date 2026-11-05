-- Opaque, revocable mission/assignment QR credentials. Payload tokens are hashed
-- at rest and only returned at issuance time for export into a QR image.
create table public.mission_qr_codes (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.missions(id) on delete cascade,
  assignment_id uuid references public.mission_assignments(id) on delete cascade,
  token_hash text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  check (num_nonnulls(mission_id, assignment_id) = 1)
);
create index mission_qr_codes_target_idx on public.mission_qr_codes(mission_id,assignment_id,is_active);
alter table public.mission_qr_codes enable row level security;
create policy "authorized mission qr view" on public.mission_qr_codes for select using (
  (mission_id is not null and exists(select 1 from public.missions m where m.id=mission_id and (m.creator_user_id=auth.uid() or public.is_org_admin(m.organization_id) or (public.has_role('teacher') and m.status='published'))))
  or (assignment_id is not null and (public.teacher_has_class((select class_id from public.mission_assignments where id=assignment_id)) or public.is_org_admin((select s.organization_id from public.mission_assignments ma join public.classes c on c.id=ma.class_id join public.schools s on s.id=c.school_id where ma.id=assignment_id))))
);

alter table public.products add column if not exists barcode_symbology text not null default 'CODE128' check (barcode_symbology in ('CODE128','EAN13','UPC'));

create or replace function public.issue_student_qr(p_student_id uuid, p_expires_at timestamptz default null)
returns table(credential_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions set row_security = off as $$
declare v_token text; v_org uuid;
begin
  select organization_id into v_org from public.students where id=p_student_id;
  if v_org is null or not (public.is_org_admin(v_org) or public.teacher_has_class((select class_id from public.students where id=p_student_id))) then raise exception 'not authorized to issue this student QR'; end if;
  update public.student_qr_credentials set is_active=false, revoked_at=now() where student_id=p_student_id and is_active;
  v_token := 'c2c.s.' || encode(gen_random_bytes(32),'hex');
  insert into public.student_qr_credentials(student_id,token_hash,is_active,expires_at,created_by) values(p_student_id,encode(digest(v_token,'sha256'),'hex'),true,p_expires_at,auth.uid()) returning id, p_expires_at into credential_id, expires_at;
  token := v_token; return next;
end $$;

create or replace function public.issue_mission_qr(p_mission_id uuid default null, p_assignment_id uuid default null, p_expires_at timestamptz default null)
returns table(code_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions set row_security = off as $$
declare v_token text; v_org uuid; v_class uuid;
begin
  if num_nonnulls(p_mission_id,p_assignment_id) <> 1 then raise exception 'exactly one mission or assignment is required'; end if;
  if p_assignment_id is not null then select s.organization_id, ma.class_id into v_org,v_class from public.mission_assignments ma join public.classes c on c.id=ma.class_id join public.schools s on s.id=c.school_id where ma.id=p_assignment_id; if v_org is null or not (public.is_org_admin(v_org) or public.teacher_has_class(v_class)) then raise exception 'not authorized to issue this assignment QR'; end if; update public.mission_qr_codes set is_active=false, revoked_at=now() where assignment_id=p_assignment_id and is_active; else select organization_id into v_org from public.missions where id=p_mission_id; if v_org is null or not (public.is_org_admin(v_org) or public.has_role('teacher')) then raise exception 'not authorized to issue this mission QR'; end if; update public.mission_qr_codes set is_active=false, revoked_at=now() where mission_id=p_mission_id and is_active; end if;
  v_token := 'c2c.m.' || encode(gen_random_bytes(32),'hex');
  insert into public.mission_qr_codes(mission_id,assignment_id,token_hash,is_active,expires_at,created_by) values(p_mission_id,p_assignment_id,encode(digest(v_token,'sha256'),'hex'),true,p_expires_at,auth.uid()) returning id,p_expires_at into code_id,expires_at;
  token:=v_token; return next;
end $$;

create or replace function public.issue_store_checkin_qr(p_store_id uuid, p_expires_at timestamptz default null)
returns table(code_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions set row_security = off as $$
declare v_token text; v_org uuid;
begin
  select organization_id into v_org from public.stores where id=p_store_id;
  if v_org is null or not (public.is_org_admin(v_org) or exists(select 1 from public.store_memberships where store_id=p_store_id and user_id=auth.uid() and is_active)) then raise exception 'not authorized to issue this store check-in QR'; end if;
  update public.store_checkin_codes set is_active=false, revoked_at=now() where store_id=p_store_id and is_active;
  v_token := 'c2c.c.' || encode(gen_random_bytes(32),'hex');
  insert into public.store_checkin_codes(store_id,token_hash,is_active,expires_at,created_by) values(p_store_id,encode(digest(v_token,'sha256'),'hex'),true,p_expires_at,auth.uid()) returning id,p_expires_at into code_id,expires_at;
  token:=v_token; return next;
end $$;

create or replace function public.revoke_qr_code(p_kind text, p_id uuid) returns void
language plpgsql security definer set search_path = public set row_security = off as $$
begin
  if p_kind='student' then update public.student_qr_credentials q set is_active=false,revoked_at=now() where q.id=p_id and (public.is_org_admin((select organization_id from public.students where id=q.student_id)) or public.teacher_has_class((select class_id from public.students where id=q.student_id))); elsif p_kind='mission' then update public.mission_qr_codes q set is_active=false,revoked_at=now() where q.id=p_id and (q.created_by=auth.uid() or public.has_role('admin')); elsif p_kind='store' then update public.store_checkin_codes q set is_active=false,revoked_at=now() where q.id=p_id and (public.is_store_org_admin(q.store_id) or exists(select 1 from public.store_memberships where store_id=q.store_id and user_id=auth.uid() and is_active)); else raise exception 'unknown QR kind'; end if;
end $$;

grant execute on function public.issue_student_qr(uuid,timestamptz), public.issue_mission_qr(uuid,uuid,timestamptz), public.issue_store_checkin_qr(uuid,timestamptz), public.revoke_qr_code(text,uuid) to authenticated;
grant select on public.mission_qr_codes, public.products to authenticated;
grant select, insert, update on public.products, public.product_data_sources, public.product_barcodes to service_role;

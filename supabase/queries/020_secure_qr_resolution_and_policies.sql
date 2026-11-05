-- Secure QR resolution contract for the student client, plus editable public policy
-- content and minimum-data deletion requests.

create table public.policy_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('privacy-policy','terms-and-conditions','data-deletion','child-safety','acceptable-use','about','contact')),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.policy_documents(id) on delete cascade,
  title text not null,
  content_markdown text not null,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  effective_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null check (char_length(requester_name) between 2 and 120),
  requester_email text not null check (char_length(requester_email) between 5 and 254),
  request_type text not null check (request_type in ('account','student_record','recording','other')),
  details text,
  status text not null default 'received' check (status in ('received','verifying','in_progress','completed','declined')),
  handled_by uuid references public.profiles(id),
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index policy_versions_public_idx on public.policy_versions(document_id, status, published_at desc);
create index deletion_requests_status_idx on public.data_deletion_requests(status, created_at desc);
create trigger policy_documents_touch before update on public.policy_documents for each row execute function public.touch_updated_at();
create trigger policy_versions_touch before update on public.policy_versions for each row execute function public.touch_updated_at();
create trigger data_deletion_requests_touch before update on public.data_deletion_requests for each row execute function public.touch_updated_at();

alter table public.policy_documents enable row level security;
alter table public.policy_versions enable row level security;
alter table public.data_deletion_requests enable row level security;

create policy "published policy documents are public" on public.policy_documents for select using (exists (select 1 from public.policy_versions v where v.document_id = id and v.status = 'published'));
create policy "admins manage policy documents" on public.policy_documents for all using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "published policy versions are public" on public.policy_versions for select using (status = 'published' or public.has_role('admin'));
create policy "admins manage policy versions" on public.policy_versions for all using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admins manage deletion requests" on public.data_deletion_requests for all using (public.has_role('admin')) with check (public.has_role('admin'));

grant select on public.policy_documents, public.policy_versions to anon, authenticated;
grant select, insert, update on public.policy_documents, public.policy_versions, public.data_deletion_requests to authenticated;

create or replace function public.submit_data_deletion_request(
  p_requester_name text,
  p_requester_email text,
  p_request_type text,
  p_details text default null
) returns uuid
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_id uuid;
begin
  if p_requester_name is null or char_length(trim(p_requester_name)) < 2 then raise exception 'Please provide your name'; end if;
  if p_requester_email is null or p_requester_email !~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$' then raise exception 'Please provide a valid email address'; end if;
  if p_request_type not in ('account','student_record','recording','other') then raise exception 'Invalid deletion request type'; end if;
  insert into public.data_deletion_requests(requester_name, requester_email, request_type, details)
  values (trim(p_requester_name), lower(trim(p_requester_email)), p_request_type, nullif(trim(coalesce(p_details,'')),'')) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.submit_data_deletion_request(text,text,text,text) to anon, authenticated;

-- A student credential becomes a short-lived opaque device-session token. The token
-- is never stored in plaintext, and it contains no student name or mission content.
create or replace function public.start_student_device_session(p_student_qr_token text)
returns table(session_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions set row_security = off as $$
declare v_credential public.student_qr_credentials%rowtype; v_token text;
begin
  select * into v_credential from public.student_qr_credentials
  where token_hash = encode(digest(p_student_qr_token,'sha256'),'hex') and is_active and revoked_at is null
    and (expires_at is null or expires_at > now());
  if v_credential.id is null then raise exception 'Student QR credential is invalid or expired'; end if;
  v_token := 'c2c.ds.' || encode(gen_random_bytes(32),'hex');
  insert into public.student_device_sessions(student_id, qr_credential_id, session_token_hash, expires_at)
  values (v_credential.student_id, v_credential.id, encode(digest(v_token,'sha256'),'hex'), now() + interval '30 days')
  returning student_device_sessions.expires_at into expires_at;
  session_token := v_token;
  return next;
end $$;

-- Resolves only a currently published, approved mission for the student tied to the
-- supplied device session. Assignment QR codes additionally enforce class and dates.
create or replace function public.resolve_mission_qr(p_mission_qr_token text, p_student_session_token text)
returns table(mission_id uuid, assignment_id uuid, mission_version_id uuid, version_number integer, title text, description text, learning_objectives text[], stages jsonb, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions set row_security = off as $$
declare v_code public.mission_qr_codes%rowtype; v_student_id uuid; v_class_id uuid; v_version uuid;
begin
  select student_id into v_student_id from public.student_device_sessions
  where session_token_hash = encode(digest(p_student_session_token,'sha256'),'hex') and revoked_at is null and expires_at > now();
  if v_student_id is null then raise exception 'Student session is invalid or expired'; end if;
  select * into v_code from public.mission_qr_codes
  where token_hash = encode(digest(p_mission_qr_token,'sha256'),'hex') and is_active and revoked_at is null
    and (expires_at is null or expires_at > now());
  if v_code.id is null then raise exception 'Mission QR code is invalid, revoked, or expired'; end if;
  select class_id into v_class_id from public.students where id=v_student_id and is_active;
  if v_class_id is null then raise exception 'Student is not eligible for missions'; end if;
  if v_code.assignment_id is not null then
    select ma.mission_version_id into v_version from public.mission_assignments ma
    where ma.id=v_code.assignment_id and ma.class_id=v_class_id and ma.status='available'
      and (ma.available_at is null or ma.available_at <= now()) and (ma.due_at is null or ma.due_at >= now());
    if v_version is null then raise exception 'This assignment is not available to this student'; end if;
  else
    select mv.id into v_version from public.mission_versions mv join public.missions m on m.id=mv.mission_id
    where mv.mission_id=v_code.mission_id and mv.version_number=m.current_version and m.status='published' and m.sharing_status in ('approved','featured');
    if v_version is null then raise exception 'This mission is not published for student access'; end if;
  end if;
  return query
  select m.id, v_code.assignment_id, mv.id, mv.version_number, mv.title, mv.description, mv.learning_objectives,
    coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'key',s.stage_key,'order',s.stage_order,'title',s.title,'prompt',s.prompt_text) order by s.stage_order) from public.mission_stages s where s.mission_version_id=mv.id), '[]'::jsonb),
    v_code.expires_at
  from public.mission_versions mv join public.missions m on m.id=mv.mission_id
  where mv.id=v_version and m.status='published' and m.sharing_status in ('approved','featured');
end $$;

grant execute on function public.start_student_device_session(text), public.resolve_mission_qr(text,text) to anon, authenticated;

-- Enforce publication/approval at issuance time, including assignment-backed codes.
create or replace function public.issue_mission_qr(p_mission_id uuid default null, p_assignment_id uuid default null, p_expires_at timestamptz default null)
returns table(code_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions set row_security = off as $$
declare v_token text; v_org uuid; v_class uuid; v_mission uuid;
begin
  if num_nonnulls(p_mission_id,p_assignment_id) <> 1 then raise exception 'exactly one mission or assignment is required'; end if;
  if p_assignment_id is not null then
    select s.organization_id, ma.class_id, ma.mission_id into v_org,v_class,v_mission from public.mission_assignments ma join public.classes c on c.id=ma.class_id join public.schools s on s.id=c.school_id where ma.id=p_assignment_id;
    if v_org is null or not (public.is_org_admin(v_org) or public.teacher_has_class(v_class)) then raise exception 'not authorized to issue this assignment QR'; end if;
    if not exists(select 1 from public.mission_assignments ma join public.missions m on m.id=ma.mission_id where ma.id=p_assignment_id and ma.status='available' and m.status='published' and m.sharing_status in ('approved','featured')) then raise exception 'Only approved, published, available assignments can receive a QR code'; end if;
    update public.mission_qr_codes set is_active=false, revoked_at=now() where assignment_id=p_assignment_id and is_active;
  else
    select organization_id into v_org from public.missions where id=p_mission_id;
    if v_org is null or not (public.is_org_admin(v_org) or exists(select 1 from public.missions where id=p_mission_id and creator_user_id=auth.uid() and public.has_role('teacher'))) then raise exception 'not authorized to issue this mission QR'; end if;
    if not exists(select 1 from public.missions where id=p_mission_id and status='published' and sharing_status in ('approved','featured')) then raise exception 'Only approved, published missions can receive a QR code'; end if;
    update public.mission_qr_codes set is_active=false, revoked_at=now() where mission_id=p_mission_id and is_active;
  end if;
  v_token := 'c2c.m.' || encode(gen_random_bytes(32),'hex');
  insert into public.mission_qr_codes(mission_id,assignment_id,token_hash,is_active,expires_at,created_by) values(p_mission_id,p_assignment_id,encode(digest(v_token,'sha256'),'hex'),true,p_expires_at,auth.uid()) returning id,p_expires_at into code_id,expires_at;
  token:=v_token; return next;
end $$;
grant execute on function public.issue_mission_qr(uuid,uuid,timestamptz) to authenticated;

insert into public.policy_documents(slug,title) values
  ('privacy-policy','Privacy Policy'),('terms-and-conditions','Terms & Conditions'),('data-deletion','Data Deletion'),('child-safety','Child Safety'),('acceptable-use','Acceptable Use'),('about','About Cart2Class'),('contact','Contact')
on conflict (slug) do nothing;

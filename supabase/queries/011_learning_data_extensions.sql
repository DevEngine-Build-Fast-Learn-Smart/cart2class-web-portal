-- Normalized extensions required by the mission library, offline student client,
-- product provenance, moderation, and protected learner-progress workflows.
create table public.skill_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('phonemic_awareness','phonics','fluency','math','general')),
  created_at timestamptz not null default now()
);
create table public.mission_skill_tags (
  mission_id uuid not null references public.missions(id) on delete cascade,
  skill_tag_id uuid not null references public.skill_tags(id) on delete cascade,
  primary key (mission_id,skill_tag_id)
);
create table public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  skill_tag_id uuid not null references public.skill_tags(id),
  attempted_count integer not null default 0 check (attempted_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0 and correct_count <= attempted_count),
  last_activity_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(student_id,skill_tag_id)
);
create table public.student_device_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  qr_credential_id uuid references public.student_qr_credentials(id) on delete set null,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.product_data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null check (source_type in ('external','teacher_managed','admin_managed')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.product_barcodes (
  barcode text primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  data_source_id uuid references public.product_data_sources(id),
  retrieved_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.mission_reviews (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  reviewer_user_id uuid not null references public.profiles(id),
  decision text not null check (decision in ('approved','rejected','changes_requested')),
  feedback text,
  created_at timestamptz not null default now()
);
create index student_progress_student_idx on public.student_progress(student_id,updated_at desc);
create index product_barcodes_product_idx on public.product_barcodes(product_id);
create index mission_reviews_mission_idx on public.mission_reviews(mission_id,created_at desc);
create trigger student_progress_touch before update on public.student_progress for each row execute function public.touch_updated_at();

alter table public.skill_tags enable row level security;
alter table public.mission_skill_tags enable row level security;
alter table public.student_progress enable row level security;
alter table public.student_device_sessions enable row level security;
alter table public.product_data_sources enable row level security;
alter table public.product_barcodes enable row level security;
alter table public.mission_reviews enable row level security;
create policy "educators view skill tags" on public.skill_tags for select using (public.has_role('teacher') or public.has_role('admin'));
create policy "visible missions expose skill tags" on public.mission_skill_tags for select using (exists(select 1 from public.missions m where m.id=mission_id and (m.sharing_status in ('approved','featured') or m.creator_user_id=auth.uid() or public.is_org_admin(m.organization_id))));
create policy "authorized progress view" on public.student_progress for select using (public.parent_has_student(student_id) or public.teacher_has_class((select class_id from public.students where id=student_id)) or public.is_org_admin((select organization_id from public.students where id=student_id)));
create policy "educators view product provenance" on public.product_data_sources for select using (public.has_role('teacher') or public.has_role('admin'));
create policy "educators view product barcodes" on public.product_barcodes for select using (public.has_role('teacher') or public.has_role('admin'));
create policy "creator or admin view reviews" on public.mission_reviews for select using (exists(select 1 from public.missions m where m.id=mission_id and (m.creator_user_id=auth.uid() or public.is_org_admin(m.organization_id))));
create policy "admins create reviews" on public.mission_reviews for insert with check (reviewer_user_id=auth.uid() and exists(select 1 from public.missions m where m.id=mission_id and public.is_org_admin(m.organization_id)));

-- Enables the development-only provisioner to add a metadata-only recording placeholder.
grant select, insert, update on table public.reading_recordings to service_role;

-- Migration: Add student-level mission assignments
create table if not exists public.mission_student_assignments (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(mission_id, student_id)
);

grant all on public.mission_student_assignments to authenticated, service_role, anon;
alter table public.mission_student_assignments enable row level security;

create policy "allow all access to mission_student_assignments"
  on public.mission_student_assignments
  for all
  using (true)
  with check (true);


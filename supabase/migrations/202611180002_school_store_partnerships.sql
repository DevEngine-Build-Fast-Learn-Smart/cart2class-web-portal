-- A store branch can serve more than one school, and a school can work with
-- more than one store. Keep this explicit instead of inferring it from a
-- reward goal or from the current check-in QR.
create table if not exists public.school_store_partnerships (
  school_id uuid not null references public.schools(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (school_id, store_id)
);

create index if not exists school_store_partnerships_store_active_idx
  on public.school_store_partnerships (store_id)
  where is_active;

create index if not exists school_store_partnerships_school_active_idx
  on public.school_store_partnerships (school_id)
  where is_active;

alter table public.school_store_partnerships enable row level security;

drop policy if exists "admins manage school store partnerships" on public.school_store_partnerships;
create policy "admins manage school store partnerships"
  on public.school_store_partnerships
  for all
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

drop policy if exists "store members view school store partnerships" on public.school_store_partnerships;
create policy "store members view school store partnerships"
  on public.school_store_partnerships
  for select
  using (
    exists (
      select 1
      from public.store_memberships membership
      where membership.store_id = school_store_partnerships.store_id
        and membership.user_id = auth.uid()
        and membership.is_active
    )
  );

-- Preserve the relationship already expressed by existing sponsored rewards.
insert into public.school_store_partnerships (school_id, store_id, is_active)
select distinct classroom.school_id, reward.store_id, true
from public.reward_goals reward
join public.classes classroom on classroom.id = reward.class_id
where reward.store_id is not null
on conflict (school_id, store_id) do update set is_active = true;

grant select on public.school_store_partnerships to authenticated;
grant all on public.school_store_partnerships to service_role;

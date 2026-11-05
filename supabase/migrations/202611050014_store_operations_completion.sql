-- Store-only operational data. No student identifier, profile, answer, recording,
-- or learning-response field is stored in a check-in event.
alter table public.stores add column if not exists business_hours text;
alter table public.stores add column if not exists representative_name text;

create table public.store_checkin_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  checkin_code_id uuid references public.store_checkin_codes(id) on delete set null,
  class_id uuid not null references public.classes(id) on delete restrict,
  occurred_at timestamptz not null default now()
);
create table public.reward_preparations (
  id uuid primary key default gen_random_uuid(),
  reward_goal_id uuid not null unique references public.reward_goals(id) on delete cascade,
  prepared_by uuid not null references public.profiles(id),
  preparation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index store_checkin_events_store_occurred_idx on public.store_checkin_events(store_id, occurred_at desc);
create index store_checkin_events_store_class_idx on public.store_checkin_events(store_id, class_id);
create trigger reward_preparations_touch before update on public.reward_preparations for each row execute function public.touch_updated_at();

alter table public.store_checkin_events enable row level security;
alter table public.reward_preparations enable row level security;
create policy "store members view own aggregate checkins" on public.store_checkin_events for select using (exists(select 1 from public.store_memberships sm where sm.store_id=store_checkin_events.store_id and sm.user_id=auth.uid() and sm.is_active));
create policy "store members view own preparations" on public.reward_preparations for select using (exists(select 1 from public.reward_goals rg join public.store_memberships sm on sm.store_id=rg.store_id where rg.id=reward_goal_id and sm.user_id=auth.uid() and sm.is_active));
grant select on public.store_checkin_events, public.reward_preparations to authenticated;

create or replace function public.record_store_checkin(p_checkin_token text, p_student_session_token text)
returns uuid
language plpgsql security definer set search_path = public, extensions set row_security = off as $$
declare v_code public.store_checkin_codes%rowtype; v_class_id uuid; v_event_id uuid;
begin
  select * into v_code from public.store_checkin_codes where token_hash=encode(digest(p_checkin_token,'sha256'),'hex') and is_active and revoked_at is null and (expires_at is null or expires_at > now());
  if v_code.id is null then raise exception 'Store check-in code is invalid or expired'; end if;
  select s.class_id into v_class_id from public.student_device_sessions ds join public.students s on s.id=ds.student_id where ds.session_token_hash=encode(digest(p_student_session_token,'sha256'),'hex') and ds.revoked_at is null and ds.expires_at > now() and s.is_active;
  if v_class_id is null then raise exception 'Student session is invalid or is not assigned to a class'; end if;
  insert into public.store_checkin_events(store_id,checkin_code_id,class_id) values(v_code.store_id,v_code.id,v_class_id) returning id into v_event_id;
  return v_event_id;
end $$;

create or replace function public.my_store_dashboard()
returns table(store_id uuid, mission_participation bigint, participating_classes bigint, active_goals bigint, ready_rewards bigint)
language sql stable security definer set search_path = public set row_security = off as $$
  select sm.store_id,
    (select count(*) from public.store_checkin_events e where e.store_id=sm.store_id),
    (select count(distinct e.class_id) from public.store_checkin_events e where e.store_id=sm.store_id),
    (select count(*) from public.reward_goals rg where rg.store_id=sm.store_id and rg.status='active'),
    (select count(*) from public.reward_goals rg where rg.store_id=sm.store_id and rg.status='ready')
  from public.store_memberships sm where sm.user_id=auth.uid() and sm.is_active
$$;

create or replace function public.my_store_participation()
returns table(class_id uuid, class_name text, grade_level smallint, checkin_count bigint, last_checkin_at timestamptz)
language sql stable security definer set search_path = public set row_security = off as $$
  select e.class_id,c.name,c.grade_level,count(*),max(e.occurred_at)
  from public.store_checkin_events e join public.classes c on c.id=e.class_id
  where exists(select 1 from public.store_memberships sm where sm.store_id=e.store_id and sm.user_id=auth.uid() and sm.is_active)
  group by e.class_id,c.name,c.grade_level order by max(e.occurred_at) desc
$$;

create or replace function public.my_store_recent_activity()
returns table(activity_type text, title text, detail text, occurred_at timestamptz)
language sql stable security definer set search_path = public set row_security = off as $$
  select 'check_in'::text, 'Store check-in'::text, 'A participating class checked in.'::text, e.occurred_at
  from public.store_checkin_events e where exists(select 1 from public.store_memberships sm where sm.store_id=e.store_id and sm.user_id=auth.uid() and sm.is_active)
  union all
  select re.event_type, 'Reward update', coalesce(rg.title,'Reward commitment'), re.created_at
  from public.reward_events re join public.reward_goals rg on rg.id=re.reward_goal_id
  where exists(select 1 from public.store_memberships sm where sm.store_id=rg.store_id and sm.user_id=auth.uid() and sm.is_active)
  order by occurred_at desc limit 20
$$;

create or replace function public.save_reward_preparation(p_reward_goal_id uuid, p_preparation_note text default null)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
begin
  if not exists(select 1 from public.reward_goals rg join public.store_memberships sm on sm.store_id=rg.store_id where rg.id=p_reward_goal_id and sm.user_id=auth.uid() and sm.is_active) then raise exception 'not authorized to prepare this reward'; end if;
  insert into public.reward_preparations(reward_goal_id,prepared_by,preparation_note) values(p_reward_goal_id,auth.uid(),nullif(trim(coalesce(p_preparation_note,'')),''))
  on conflict(reward_goal_id) do update set preparation_note=excluded.preparation_note,prepared_by=auth.uid(),updated_at=now();
end $$;

create or replace function public.update_own_store_profile(p_store_id uuid, p_contact_email text, p_address text, p_business_hours text default null, p_representative_name text default null)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
begin
  if not exists(select 1 from public.store_memberships where user_id=auth.uid() and store_id=p_store_id and is_active) then raise exception 'not authorized to update this store profile'; end if;
  update public.stores set contact_email=nullif(trim(p_contact_email),''), address=nullif(trim(p_address),''), business_hours=nullif(trim(coalesce(p_business_hours,'')),''), representative_name=nullif(trim(coalesce(p_representative_name,'')), '') where id=p_store_id;
end $$;

grant execute on function public.record_store_checkin(text,text) to anon, authenticated;
grant execute on function public.my_store_dashboard(), public.my_store_participation(), public.my_store_recent_activity(), public.save_reward_preparation(uuid,text), public.update_own_store_profile(uuid,text,text,text,text) to authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger organizations_touch before update on public.organizations for each row execute function public.touch_updated_at();
create trigger schools_touch before update on public.schools for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger classes_touch before update on public.classes for each row execute function public.touch_updated_at();
create trigger students_touch before update on public.students for each row execute function public.touch_updated_at();
create trigger stores_touch before update on public.stores for each row execute function public.touch_updated_at();
create trigger missions_touch before update on public.missions for each row execute function public.touch_updated_at();

-- Version snapshots protect active student work from later mission edits.
create or replace function public.create_mission_version(p_mission_id uuid, p_snapshot jsonb) returns uuid language plpgsql security definer set search_path = public as $$ declare v_id uuid; v_next integer; begin select current_version + 1 into v_next from public.missions where id = p_mission_id for update; update public.missions set current_version=v_next where id=p_mission_id; insert into public.mission_versions(mission_id,version_number,title,description,snapshot,created_by) select id,v_next,title,description,p_snapshot,auth.uid() from public.missions where id=p_mission_id returning id into v_id; return v_id; end $$;

-- Idempotent offline event receipt. The Flutter client must use a stable client_event_id.
create or replace function public.receive_sync_event(p_client_event_id uuid,p_student_id uuid,p_event_type text,p_payload jsonb) returns uuid language plpgsql security definer set search_path = public as $$ declare event_id uuid; begin insert into public.sync_events(client_event_id,student_id,event_type,payload) values(p_client_event_id,p_student_id,p_event_type,p_payload) on conflict(client_event_id) do update set client_event_id=excluded.client_event_id returning id into event_id; return event_id; end $$;

-- The only store dashboard aggregate. It checks membership inside a trusted function and returns no student-level fields.
create or replace function public.my_store_dashboard() returns table(store_id uuid, mission_participation bigint, participating_classes bigint, active_goals bigint, ready_rewards bigint) language sql stable security definer set search_path = public as $$
  select sm.store_id,
    count(distinct a.id) filter (where a.status='completed'),
    count(distinct rg.class_id),
    count(distinct rg.id) filter (where rg.status='active'),
    count(distinct rg.id) filter (where rg.status='ready')
  from public.store_memberships sm
  join public.reward_goals rg on rg.store_id=sm.store_id
  left join public.mission_assignments ma on ma.class_id=rg.class_id
  left join public.mission_attempts a on a.assignment_id=ma.id
  where sm.user_id=auth.uid() and sm.is_active
  group by sm.store_id
$$;
grant execute on function public.my_store_dashboard() to authenticated;

-- Transactional workflows used by the teacher, administrator, and store portals.
create or replace function public.create_teacher_mission(p_title text, p_description text, p_grade_min smallint, p_grade_max smallint, p_estimated_minutes smallint default 12)
returns uuid
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_org uuid; v_mission uuid; v_version uuid; v_stage text; v_order smallint := 0;
begin
  if not public.has_role('teacher') then raise exception 'not authorized to create a mission'; end if;
  if char_length(trim(p_title)) not between 3 and 140 or p_grade_min not between 0 and 2 or p_grade_max not between p_grade_min and 2 or p_estimated_minutes not between 1 and 60 then raise exception 'Mission details are invalid'; end if;
  select organization_id into v_org from public.role_memberships where user_id=auth.uid() and role='teacher' and is_active order by created_at limit 1;
  if v_org is null then raise exception 'Teacher organization is not configured'; end if;
  insert into public.missions(organization_id,creator_user_id,title,description,grade_min,grade_max,estimated_minutes) values(v_org,auth.uid(),trim(p_title),trim(coalesce(p_description,'')),p_grade_min,p_grade_max,p_estimated_minutes) returning id into v_mission;
  insert into public.mission_versions(mission_id,version_number,title,description,created_by) values(v_mission,1,trim(p_title),trim(coalesce(p_description,'')),auth.uid()) returning id into v_version;
  foreach v_stage in array array['phonemic_awareness','phonics','fluency','math'] loop
    v_order := v_order + 1;
    insert into public.mission_stages(mission_version_id,stage_key,stage_order,title,prompt_text) values(v_version,v_stage,v_order,initcap(replace(v_stage,'_',' ')),'Add the learning prompt before submitting this mission.');
  end loop;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id) values(v_org,auth.uid(),'mission.created','mission',v_mission);
  return v_mission;
end $$;

create or replace function public.submit_mission_for_review(p_mission_id uuid)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_org uuid; v_version uuid;
begin
  select organization_id into v_org from public.missions where id=p_mission_id and creator_user_id=auth.uid();
  if v_org is null or not public.has_role('teacher') then raise exception 'not authorized to submit this mission'; end if;
  select id into v_version from public.mission_versions where mission_id=p_mission_id and version_number=(select current_version from public.missions where id=p_mission_id);
  if (select count(*) from public.mission_stages where mission_version_id=v_version) <> 4 then raise exception 'All four learning stages are required before submission'; end if;
  update public.missions set sharing_status='submitted', status='draft' where id=p_mission_id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id) values(v_org,auth.uid(),'mission.submitted','mission',p_mission_id);
end $$;

create or replace function public.review_mission(p_mission_id uuid, p_decision text, p_feedback text default null)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.missions where id=p_mission_id;
  if v_org is null or not public.is_org_admin(v_org) or p_decision not in ('approved','rejected','changes_requested') then raise exception 'not authorized to review this mission'; end if;
  insert into public.mission_reviews(mission_id,reviewer_user_id,decision,feedback) values(p_mission_id,auth.uid(),p_decision,nullif(trim(coalesce(p_feedback,'')),''));
  update public.missions set sharing_status=case p_decision when 'approved' then 'approved' when 'rejected' then 'rejected' else 'under_review' end, status='draft' where id=p_mission_id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata) values(v_org,auth.uid(),'mission.reviewed','mission',p_mission_id,jsonb_build_object('decision',p_decision));
end $$;

create or replace function public.publish_mission(p_mission_id uuid)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.missions where id=p_mission_id and sharing_status in ('approved','featured');
  if v_org is null or not public.is_org_admin(v_org) then raise exception 'Only an administrator can publish an approved mission'; end if;
  update public.missions set status='published' where id=p_mission_id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id) values(v_org,auth.uid(),'mission.published','mission',p_mission_id);
end $$;

create or replace function public.transition_reward_goal(p_reward_goal_id uuid, p_action text)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_goal public.reward_goals%rowtype; v_allowed boolean;
begin
  select * into v_goal from public.reward_goals where id=p_reward_goal_id;
  if v_goal.id is null then raise exception 'Reward goal not found'; end if;
  v_allowed := public.is_org_admin((select organization_id from public.classes c join public.schools s on s.id=c.school_id where c.id=v_goal.class_id)) or public.teacher_has_class(v_goal.class_id) or exists(select 1 from public.store_memberships where user_id=auth.uid() and store_id=v_goal.store_id and is_active);
  if not v_allowed then raise exception 'not authorized to update this reward'; end if;
  if p_action='ready' and v_goal.status='active' and v_goal.current_stars >= v_goal.target_stars then
    update public.reward_goals set status='ready',ready_by=auth.uid(),ready_at=now() where id=p_reward_goal_id;
  elsif p_action='picked_up' and v_goal.status='ready' then
    update public.reward_goals set status='picked_up',picked_up_by=auth.uid(),picked_up_at=now() where id=p_reward_goal_id;
  else raise exception 'This reward cannot make that transition'; end if;
  insert into public.reward_events(reward_goal_id,actor_user_id,event_type) values(p_reward_goal_id,auth.uid(),p_action);
end $$;

create or replace function public.review_reading_recording(p_recording_id uuid, p_feedback text default null, p_request_another boolean default false)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_student uuid;
begin
  select student_id into v_student from public.reading_recordings where id=p_recording_id;
  if v_student is null or not (public.teacher_has_class((select class_id from public.students where id=v_student)) or public.is_org_admin((select organization_id from public.students where id=v_student))) then raise exception 'not authorized to review this recording'; end if;
  update public.reading_recordings set review_status='reviewed',reviewed_by=auth.uid(),reviewer_feedback=case when p_request_another then coalesce(nullif(trim(p_feedback),''),'Please submit another recording.') else nullif(trim(p_feedback),'') end,reviewed_at=now() where id=p_recording_id;
end $$;

grant execute on function public.create_teacher_mission(text,text,smallint,smallint,smallint), public.submit_mission_for_review(uuid), public.review_mission(uuid,text,text), public.publish_mission(uuid), public.transition_reward_goal(uuid,text), public.review_reading_recording(uuid,text,boolean) to authenticated;

-- Store partners prepare rewards; an educator or administrator confirms collection.
create or replace function public.transition_reward_goal(p_reward_goal_id uuid, p_action text)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_goal public.reward_goals%rowtype; v_is_store boolean; v_is_staff boolean;
begin
  select * into v_goal from public.reward_goals where id=p_reward_goal_id;
  if v_goal.id is null then raise exception 'Reward goal not found'; end if;
  v_is_store := exists(select 1 from public.store_memberships where user_id=auth.uid() and store_id=v_goal.store_id and is_active);
  v_is_staff := public.is_org_admin((select organization_id from public.classes c join public.schools s on s.id=c.school_id where c.id=v_goal.class_id)) or public.teacher_has_class(v_goal.class_id);
  if not (v_is_store or v_is_staff) then raise exception 'not authorized to update this reward'; end if;
  if p_action='ready' and v_goal.status='active' and v_goal.current_stars >= v_goal.target_stars then
    update public.reward_goals set status='ready',ready_by=auth.uid(),ready_at=now() where id=p_reward_goal_id;
  elsif p_action='picked_up' and v_goal.status='ready' and v_is_staff then
    update public.reward_goals set status='picked_up',picked_up_by=auth.uid(),picked_up_at=now() where id=p_reward_goal_id;
  else raise exception 'This reward cannot make that transition'; end if;
  insert into public.reward_events(reward_goal_id,actor_user_id,event_type) values(p_reward_goal_id,auth.uid(),p_action);
end $$;

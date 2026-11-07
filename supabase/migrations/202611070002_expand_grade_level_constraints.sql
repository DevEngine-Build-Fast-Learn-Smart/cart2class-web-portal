-- Expand grade level constraints from pilot K-2 to full K-12 educational range (0 through 12)
-- across classes, students, and missions.

ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_grade_level_check;
ALTER TABLE public.classes ADD CONSTRAINT classes_grade_level_check CHECK (grade_level >= 0 AND grade_level <= 12);

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_grade_level_check;
ALTER TABLE public.students ADD CONSTRAINT students_grade_level_check CHECK (grade_level >= 0 AND grade_level <= 12);

ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_grade_min_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_grade_min_check CHECK (grade_min >= 0 AND grade_min <= 12);

ALTER TABLE public.missions DROP CONSTRAINT IF EXISTS missions_check;
ALTER TABLE public.missions ADD CONSTRAINT missions_check CHECK (grade_max >= grade_min AND grade_max <= 12);

create or replace function public.create_teacher_mission(p_title text, p_description text, p_grade_min smallint, p_grade_max smallint, p_estimated_minutes smallint default 12)
returns uuid language plpgsql security definer as $$
declare
  v_org uuid;
  v_mission uuid;
begin
  select organization_id into v_org from public.teacher_class_assignments tca join public.classes c on c.id=tca.class_id join public.schools s on s.id=c.school_id where tca.teacher_user_id=auth.uid() and tca.is_active limit 1;
  if v_org is null then select organization_id into v_org from public.role_memberships rm join public.profiles p on p.id=rm.user_id where rm.user_id=auth.uid() and rm.role='teacher' limit 1; end if;
  if v_org is null then select id into v_org from public.organizations order by created_at limit 1; end if;
  if char_length(trim(p_title)) not between 3 and 140 or p_grade_min not between 0 and 12 or p_grade_max not between p_grade_min and 12 or p_estimated_minutes not between 1 and 60 then raise exception 'Mission details are invalid'; end if;
  insert into public.missions(organization_id,creator_user_id,title,description,grade_min,grade_max,estimated_minutes) values(v_org,auth.uid(),trim(p_title),trim(coalesce(p_description,'')),p_grade_min,p_grade_max,p_estimated_minutes) returning id into v_mission;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id) values(v_org,auth.uid(),'mission.created','mission',v_mission);
  return v_mission;
end;
$$;

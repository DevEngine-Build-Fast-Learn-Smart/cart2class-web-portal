create or replace function public.save_teacher_student(p_student_id uuid default null, p_class_id uuid default null, p_first_name text default null, p_last_initial text default null, p_grade_level smallint default null)
returns uuid
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_school uuid; v_org uuid; v_student_id uuid; v_existing_class uuid;
begin
  if not public.has_role('teacher') then raise exception 'not authorized to manage students'; end if;
  if p_class_id is null or not public.teacher_has_class(p_class_id) then raise exception 'not authorized for this class'; end if;
  if p_first_name is null or char_length(trim(p_first_name)) < 1 then raise exception 'A first name is required'; end if;
  if p_last_initial is not null and (char_length(trim(p_last_initial)) <> 1 or trim(p_last_initial) !~ '^[A-Za-z]$') then raise exception 'Last initial must be one letter'; end if;
  select school_id into v_school from public.classes where id=p_class_id and is_active;
  select organization_id into v_org from public.schools where id=v_school and is_active;
  if v_org is null or p_grade_level not between 0 and 2 then raise exception 'Student details are invalid'; end if;
  if p_student_id is null then
    insert into public.students(organization_id,school_id,class_id,first_name,last_initial,grade_level,is_active) values(v_org,v_school,p_class_id,trim(p_first_name),nullif(upper(trim(coalesce(p_last_initial,''))),''),p_grade_level,true) returning id into v_student_id;
    insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata) values(v_org,auth.uid(),'student.created','student',v_student_id,jsonb_build_object('class_id',p_class_id));
  else
    select class_id into v_existing_class from public.students where id=p_student_id;
    if v_existing_class is null or not public.teacher_has_class(v_existing_class) then raise exception 'not authorized for this student'; end if;
    update public.students set school_id=v_school, class_id=p_class_id, first_name=trim(p_first_name), last_initial=nullif(upper(trim(coalesce(p_last_initial,''))),''), grade_level=p_grade_level, updated_at=now() where id=p_student_id returning id into v_student_id;
    insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,metadata) values(v_org,auth.uid(),'student.updated','student',v_student_id,jsonb_build_object('class_id',p_class_id));
  end if;
  return v_student_id;
end $$;

create or replace function public.deactivate_teacher_student(p_student_id uuid)
returns void
language plpgsql security definer set search_path = public set row_security = off as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.students where id=p_student_id and public.teacher_has_class(class_id);
  if v_org is null then raise exception 'not authorized for this student'; end if;
  update public.students set is_active=false,updated_at=now() where id=p_student_id;
  update public.student_qr_credentials set is_active=false,revoked_at=now() where student_id=p_student_id and is_active;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id) values(v_org,auth.uid(),'student.deactivated','student',p_student_id);
end $$;
grant execute on function public.save_teacher_student(uuid,uuid,text,text,smallint), public.deactivate_teacher_student(uuid) to authenticated;

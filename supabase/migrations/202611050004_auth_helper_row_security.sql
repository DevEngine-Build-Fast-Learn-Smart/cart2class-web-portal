-- Membership helpers deliberately run outside caller RLS to avoid recursive policy
-- evaluation. They expose only boolean authorization outcomes for auth.uid().
create or replace function public.is_org_admin(org uuid) returns boolean
language sql stable security definer set search_path = public set row_security = off as $$
  select exists(select 1 from public.role_memberships where user_id = auth.uid() and organization_id = org and role = 'admin' and is_active)
$$;
create or replace function public.has_role(target public.app_role) returns boolean
language sql stable security definer set search_path = public set row_security = off as $$
  select exists(select 1 from public.role_memberships where user_id = auth.uid() and role = target and is_active)
$$;
create or replace function public.teacher_has_class(target_class uuid) returns boolean
language sql stable security definer set search_path = public set row_security = off as $$
  select exists(select 1 from public.teacher_class_assignments where teacher_user_id = auth.uid() and class_id = target_class and is_active)
$$;
create or replace function public.parent_has_student(target_student uuid) returns boolean
language sql stable security definer set search_path = public set row_security = off as $$
  select exists(select 1 from public.parent_student_relationships where parent_user_id = auth.uid() and student_id = target_student and is_active)
$$;

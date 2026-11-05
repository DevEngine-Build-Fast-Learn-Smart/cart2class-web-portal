-- Private recording objects are accessible only when their metadata row is visible
-- to the requester under the same parent/teacher/admin authorization rules.
drop policy if exists "recordings authorized view" on storage.objects;
create policy "recordings authorized view" on storage.objects for select using (
  bucket_id = 'reading-recordings' and exists (
    select 1 from public.reading_recordings rr
    where rr.storage_path = name and (
      public.parent_has_student(rr.student_id)
      or public.teacher_has_class((select class_id from public.students where id=rr.student_id))
      or public.is_org_admin((select organization_id from public.students where id=rr.student_id))
    )
  )
);

-- Student recording writes are accepted through a trusted offline-sync/Edge Function
-- using service_role, never directly from an arbitrary authenticated browser session.
drop policy if exists "student sync uploads recordings" on storage.objects;

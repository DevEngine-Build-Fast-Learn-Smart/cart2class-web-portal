insert into storage.buckets(id,name,public) values ('mission-assets','mission-assets',false),('reading-recordings','reading-recordings',false) on conflict (id) do update set public=false;
create policy "authorized mission assets" on storage.objects for select using (bucket_id='mission-assets' and (public.has_role('teacher') or public.has_role('admin') or public.has_role('parent')));
create policy "teachers upload mission assets" on storage.objects for insert with check (bucket_id='mission-assets' and (public.has_role('teacher') or public.has_role('admin')));
create policy "recordings authorized view" on storage.objects for select using (bucket_id='reading-recordings' and (public.has_role('teacher') or public.has_role('admin') or public.has_role('parent')));
create policy "student sync uploads recordings" on storage.objects for insert with check (bucket_id='reading-recordings' and auth.role()='authenticated');

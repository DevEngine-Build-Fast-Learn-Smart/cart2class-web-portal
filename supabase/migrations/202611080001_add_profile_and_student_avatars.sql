-- 202611080001_add_profile_and_student_avatars.sql
-- Add avatar and logo image support for profiles, students, schools, and stores.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS logo_url text;

-- Allow authenticated users to view profiles with avatar
GRANT SELECT, UPDATE(display_name, avatar_url, updated_at) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- Allow teachers and admins to view and update student avatars
GRANT SELECT, INSERT, UPDATE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO service_role;

-- Allow authenticated users and admins to view and update store logos
GRANT SELECT, UPDATE(logo_url) ON public.stores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO service_role;


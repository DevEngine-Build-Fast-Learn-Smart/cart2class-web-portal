-- Supabase installs pgcrypto in extensions; QR issuance functions use it only for
-- high-entropy token generation and SHA-256 hashes.
alter function public.issue_student_qr(uuid,timestamptz) set search_path = public, extensions;
alter function public.issue_mission_qr(uuid,uuid,timestamptz) set search_path = public, extensions;
alter function public.issue_store_checkin_qr(uuid,timestamptz) set search_path = public, extensions;

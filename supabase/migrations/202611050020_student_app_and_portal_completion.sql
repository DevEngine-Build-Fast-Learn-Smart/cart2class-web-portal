-- 202611050020_student_app_and_portal_completion.sql
-- Schema extensions for Student App API contracts, 4-stage mission builder,
-- offline asset manifest, telemetry, role management, and parent-child linking.

-- 1. Students enhancements
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_invite_code text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS card_code text;
CREATE UNIQUE INDEX IF NOT EXISTS students_parent_invite_code_idx ON public.students(parent_invite_code) WHERE parent_invite_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_card_code_idx ON public.students(card_code) WHERE card_code IS NOT NULL;

-- 2. Classes enhancements
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS reward_title text DEFAULT 'Pizza party';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS confirmed_stars integer NOT NULL DEFAULT 0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS target_stars integer NOT NULL DEFAULT 100;

-- 3. Missions enhancements
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS mission_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS stars integer NOT NULL DEFAULT 5;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS opens_at timestamptz;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS passage text;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS passage_detail text;

-- 4. Mission stages enhancements
ALTER TABLE public.mission_stages ADD COLUMN IF NOT EXISTS passage_text text;
ALTER TABLE public.mission_stages ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE public.mission_stages ADD COLUMN IF NOT EXISTS recording_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.mission_stages ADD COLUMN IF NOT EXISTS duration_seconds integer NOT NULL DEFAULT 60;

-- 5. Mission questions enhancements
ALTER TABLE public.mission_questions ADD COLUMN IF NOT EXISTS spoken_prompt text;
ALTER TABLE public.mission_questions ADD COLUMN IF NOT EXISTS question_kind text;

-- 6. Mission Products for Stage 2 discovery and offline barcode scanning
CREATE TABLE IF NOT EXISTS public.mission_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  barcode text NOT NULL,
  image_asset text,
  price_cents integer NOT NULL DEFAULT 100,
  currency text NOT NULL DEFAULT 'USD',
  weight_grams integer NOT NULL DEFAULT 500,
  package_size text DEFAULT '1 each',
  instructions text,
  order_index smallint NOT NULL DEFAULT 1,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mission_products_mission_idx ON public.mission_products(mission_id, order_index);

-- 7. Mission Assets for offline manifest and media library
CREATE TABLE IF NOT EXISTS public.mission_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
  stage_key text,
  asset_path text NOT NULL,
  cdn_url text NOT NULL,
  sha256_hash text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  content_type text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mission_assets_mission_idx ON public.mission_assets(mission_id);

-- 8. Mission Runs for telemetry and teacher/parent live monitoring
CREATE TABLE IF NOT EXISTS public.mission_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  stage smallint NOT NULL DEFAULT 1,
  checked_in boolean NOT NULL DEFAULT false,
  complete boolean NOT NULL DEFAULT false,
  stars_earned integer NOT NULL DEFAULT 0,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  products_scanned text[] NOT NULL DEFAULT '{}',
  recording_seconds integer,
  recording_passage text,
  recording_storage_path text,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, mission_id)
);
CREATE INDEX IF NOT EXISTS mission_runs_student_idx ON public.mission_runs(student_id, updated_at DESC);

-- 9. Question Attempts for detailed student activity tracking
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  prompt text,
  choice text NOT NULL,
  is_correct boolean NOT NULL,
  attempt_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS question_attempts_student_mission_idx ON public.question_attempts(student_id, mission_id, created_at ASC);

-- 10. Sync events log for idempotency
CREATE TABLE IF NOT EXISTS public.sync_events_log (
  event_id text PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  kind text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.mission_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events_log ENABLE ROW LEVEL SECURITY;

-- Policies for mission_products
CREATE POLICY "mission products viewable by authenticated and anon" ON public.mission_products
  FOR SELECT USING (true);
CREATE POLICY "teachers and admins manage mission products" ON public.mission_products
  FOR ALL USING (public.has_role('teacher') OR public.has_role('admin'))
  WITH CHECK (public.has_role('teacher') OR public.has_role('admin'));

-- Policies for mission_assets
CREATE POLICY "mission assets viewable by authenticated and anon" ON public.mission_assets
  FOR SELECT USING (true);
CREATE POLICY "teachers and admins manage mission assets" ON public.mission_assets
  FOR ALL USING (public.has_role('teacher') OR public.has_role('admin'))
  WITH CHECK (public.has_role('teacher') OR public.has_role('admin'));

-- Policies for mission_runs
CREATE POLICY "mission runs viewable by linked parents teachers admins" ON public.mission_runs
  FOR SELECT USING (
    public.parent_has_student(student_id)
    OR public.teacher_has_class((SELECT class_id FROM public.students WHERE id = student_id))
    OR public.has_role('admin')
  );
CREATE POLICY "service and authenticated insert update mission runs" ON public.mission_runs
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for question_attempts
CREATE POLICY "question attempts viewable by linked parents teachers admins" ON public.question_attempts
  FOR SELECT USING (
    public.parent_has_student(student_id)
    OR public.teacher_has_class((SELECT class_id FROM public.students WHERE id = student_id))
    OR public.has_role('admin')
  );
CREATE POLICY "service and authenticated insert question attempts" ON public.question_attempts
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for sync_events_log
CREATE POLICY "sync events log viewable and manageable" ON public.sync_events_log
  FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.mission_products, public.mission_assets, public.missions, public.mission_versions, public.mission_stages, public.mission_questions, public.mission_answer_options TO anon;

-- Touch triggers
CREATE TRIGGER mission_products_touch BEFORE UPDATE ON public.mission_products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER mission_runs_touch BEFORE UPDATE ON public.mission_runs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


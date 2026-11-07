-- Allow all authenticated users (teachers, parents, staff) to view active partner grocery stores
-- so teachers can select stores when creating and assigning classroom missions.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stores' AND policyname = 'authenticated users view active stores'
  ) THEN
    CREATE POLICY "authenticated users view active stores" ON public.stores
    FOR SELECT TO authenticated
    USING (is_active = true);
  END IF;
END $$;


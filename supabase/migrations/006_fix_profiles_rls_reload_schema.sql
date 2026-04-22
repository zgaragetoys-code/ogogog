-- ================================================================
-- Migration 006: Fix profiles RLS + reload PostgREST schema cache
--
-- The profiles UPDATE policy was missing WITH CHECK, allowing a
-- user to change their own row's id (privilege escalation).
-- Also sends NOTIFY to reload PostgREST schema cache so the
-- columns added in 005 become visible to the JS client.
-- ================================================================

-- Drop and recreate the UPDATE policy with a WITH CHECK clause
DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Reload PostgREST schema cache so migration 005 columns are visible
SELECT pg_notify('pgrst', 'reload schema');

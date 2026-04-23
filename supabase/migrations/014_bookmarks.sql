-- ================================================================
-- 014 — Bookmarks (saved listings + saved users)
-- Run in Supabase SQL Editor.
-- ================================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('listing', 'user')),
  target_id   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user
  ON bookmarks (user_id, target_type, created_at DESC);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks"
  ON bookmarks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

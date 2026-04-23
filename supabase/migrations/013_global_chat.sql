-- ================================================================
-- 013 — Global chat
-- Run in Supabase SQL Editor.
-- ================================================================

-- ── Messages table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS global_chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 280),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users
);

CREATE INDEX IF NOT EXISTS idx_gcm_created_at
  ON global_chat_messages (created_at DESC)
  WHERE deleted_at IS NULL;

-- ── Opt-out column ──────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS global_chat_enabled boolean NOT NULL DEFAULT true;

-- ── RLS ─────────────────────────────────────────────────────────

ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read non-deleted chat messages"
  ON global_chat_messages FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can post"
  ON global_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Soft-delete: owner or admin (admin enforced in app logic via service role)
CREATE POLICY "Owner can delete own messages"
  ON global_chat_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── Realtime ─────────────────────────────────────────────────────
-- Enable realtime for this table in Supabase dashboard:
-- Database → Replication → global_chat_messages → toggle INSERT

ALTER PUBLICATION supabase_realtime ADD TABLE global_chat_messages;

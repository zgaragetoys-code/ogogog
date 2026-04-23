-- ================================================================
-- 016 — Discussion board (Twitter-style feed for buy/sell/trade posts)
-- Run in Supabase SQL Editor.
-- ================================================================

CREATE TABLE IF NOT EXISTS board_posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  post_type  text NOT NULL DEFAULT 'general'
             CHECK (post_type IN ('general', 'buying', 'selling', 'trading', 'looking_for')),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts (created_at DESC) WHERE deleted_at IS NULL;

ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board readable by all" ON board_posts
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Board insert by authenticated" ON board_posts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Board soft-delete own posts" ON board_posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Realtime for the board feed
ALTER PUBLICATION supabase_realtime ADD TABLE board_posts;

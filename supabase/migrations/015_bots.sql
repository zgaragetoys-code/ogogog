-- ================================================================
-- 015 — Bot simulation system
-- Run in Supabase SQL Editor.
-- ================================================================

-- Drop FK on global_chat_messages.user_id so bots can post
-- without being real auth users
ALTER TABLE global_chat_messages
  DROP CONSTRAINT IF EXISTS global_chat_messages_user_id_fkey;

-- Bot registry
CREATE TABLE IF NOT EXISTS bots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username        text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  avatar_seed     text NOT NULL,
  avatar_style    text NOT NULL DEFAULT 'identicon',
  bio             text,
  personality     text NOT NULL DEFAULT 'casual',  -- casual|hype|vintage|competitive|sealed|grader|investor
  chat_enabled    boolean NOT NULL DEFAULT true,
  posting_enabled boolean NOT NULL DEFAULT true,
  last_active_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bots_chat    ON bots (chat_enabled)    WHERE chat_enabled = true;
CREATE INDEX IF NOT EXISTS idx_bots_posting ON bots (posting_enabled) WHERE posting_enabled = true;

-- Link chat messages to bot identity (null for real users)
ALTER TABLE global_chat_messages
  ADD COLUMN IF NOT EXISTS bot_id uuid REFERENCES bots(id) ON DELETE SET NULL;

-- Admin-only: no RLS on bots (service role only)
-- Public: bots table readable so chat UI can resolve display names
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bots readable by all" ON bots FOR SELECT USING (true);
CREATE POLICY "Bots writable by service role only" ON bots FOR ALL TO service_role USING (true);

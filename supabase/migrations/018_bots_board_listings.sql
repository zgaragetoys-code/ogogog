-- ================================================================
-- 018 — Allow bots to post on board and create listings
-- Same pattern as 015 did for global_chat_messages.
-- ================================================================

-- Drop FK on board_posts.user_id so bots can post there
ALTER TABLE board_posts DROP CONSTRAINT IF EXISTS board_posts_user_id_fkey;

-- Link board posts to bot identity (null for real users)
ALTER TABLE board_posts ADD COLUMN IF NOT EXISTS bot_id uuid REFERENCES bots(id) ON DELETE SET NULL;

-- Drop FK on listings.user_id so bots can create listings
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_user_id_fkey;

-- Restore price_type default so inserts without explicit price_type work
ALTER TABLE listings ALTER COLUMN price_type SET DEFAULT 'firm';

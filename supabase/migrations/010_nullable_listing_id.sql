-- Allow messages without a listing_id (direct / general chat)
ALTER TABLE messages ALTER COLUMN listing_id DROP NOT NULL;

-- Keep the FK but allow NULL
-- The existing FK to listings is unchanged; NULL means no listing context.

-- Update RLS to still allow participants to see/write direct messages
-- The existing policies already use sender_id/receiver_id checks, so they
-- cover both listing-scoped and direct messages correctly.

-- Allow users to pin up to 6 collection items to their public profile
ALTER TABLE collection_items ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

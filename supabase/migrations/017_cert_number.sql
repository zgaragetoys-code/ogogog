-- ================================================================
-- 017 — Add cert_number to listings
-- Run in Supabase SQL Editor.
-- ================================================================

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS cert_number text;

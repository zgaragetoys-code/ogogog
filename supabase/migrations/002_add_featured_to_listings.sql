-- ================================================================
-- Migration 002: Add featured listing columns
-- Run in Supabase SQL Editor after 001_initial_schema.sql
-- ================================================================

ALTER TABLE listings
  ADD COLUMN is_featured   boolean     NOT NULL DEFAULT false,
  ADD COLUMN featured_until timestamptz;

-- Index for feed queries that filter/order by featured status
CREATE INDEX idx_listings_featured ON listings(is_featured, featured_until)
  WHERE is_featured = true;

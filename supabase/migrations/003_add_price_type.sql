-- Add price_type enum and column to listings.
-- 'firm'           — price required, no negotiation indicator
-- 'obo'            — price required as a starting point, shows OBO badge
-- 'open_to_offers' — no price, shows "Make an offer"

CREATE TYPE price_type_enum AS ENUM ('firm', 'obo', 'open_to_offers');

ALTER TABLE listings
  ADD COLUMN price_type price_type_enum NOT NULL DEFAULT 'firm';

-- Backfill: rows with no price become open_to_offers
UPDATE listings
SET price_type = 'open_to_offers'
WHERE price IS NULL;

-- Drop the default so new rows must supply an explicit value
ALTER TABLE listings
  ALTER COLUMN price_type DROP DEFAULT;

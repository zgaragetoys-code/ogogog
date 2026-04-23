-- ================================================================
-- 011 — Unify custom_listings into listings
-- Self-contained: creates enum types if missing, handles the case
-- where migration 004 (custom_listings) was never run.
-- Run in Supabase SQL Editor.
-- ================================================================

-- ── 1. Create enum types (idempotent) ────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE custom_category AS ENUM (
    'custom_card',
    'accessories',
    'storage',
    'slab_case',
    'loose_cards',
    'damaged_cards',
    'miscellaneous',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE condition_generic AS ENUM (
    'new',
    'like_new',
    'used',
    'damaged'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Drop old constraints that conflict with custom items ──────────────────

ALTER TABLE listings DROP CONSTRAINT IF EXISTS for_sale_requires_price;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS for_sale_requires_condition;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS graded_type_needs_fields;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS grading_fields_together;

-- ── 3. Make card_id nullable ─────────────────────────────────────────────────

ALTER TABLE listings ALTER COLUMN card_id DROP NOT NULL;

-- ── 4. Add new columns ───────────────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS title               text,
  ADD COLUMN IF NOT EXISTS set_year            smallint,
  ADD COLUMN IF NOT EXISTS set_series          text,
  ADD COLUMN IF NOT EXISTS listing_image_url   text,
  ADD COLUMN IF NOT EXISTS custom_category     custom_category,
  ADD COLUMN IF NOT EXISTS condition_generic   condition_generic;

-- ── 5. Migrate custom_listings → listings (only if the table exists) ─────────

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'custom_listings'
  ) THEN
    INSERT INTO listings (
      id, user_id,
      title, listing_type, status,
      custom_category, condition_generic,
      price_type, price,
      notes, photo_links, photo_notes,
      is_featured, featured_until,
      created_at, updated_at
    )
    SELECT
      id, user_id,
      title, listing_type, status,
      custom_category, condition_generic,
      price_type, price,
      NULLIF(TRIM(COALESCE(notes, description)), ''),
      photo_links, photo_notes,
      is_featured, featured_until,
      created_at, updated_at
    FROM custom_listings;
  END IF;
END $$;

-- ── 6. Drop custom_listings ──────────────────────────────────────────────────

DROP TABLE IF EXISTS custom_listings;

-- ── 7. Add improved constraints ──────────────────────────────────────────────

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listing_has_identity;
ALTER TABLE listings ADD CONSTRAINT listing_has_identity
  CHECK (card_id IS NOT NULL OR (title IS NOT NULL AND char_length(TRIM(title)) >= 1));

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listing_for_sale_price;
ALTER TABLE listings ADD CONSTRAINT listing_for_sale_price
  CHECK (
    listing_type != 'for_sale'
    OR price IS NOT NULL
    OR price_type = 'open_to_offers'
  );

ALTER TABLE listings DROP CONSTRAINT IF EXISTS graded_needs_company;
ALTER TABLE listings ADD CONSTRAINT graded_needs_company
  CHECK (condition_type != 'graded' OR grading_company IS NOT NULL);

ALTER TABLE listings DROP CONSTRAINT IF EXISTS grade_needs_company;
ALTER TABLE listings ADD CONSTRAINT grade_needs_company
  CHECK (grade IS NULL OR grading_company IS NOT NULL);

-- ── 8. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_listings_set_year   ON listings(set_year);
CREATE INDEX IF NOT EXISTS idx_listings_set_series ON listings(set_series);
CREATE INDEX IF NOT EXISTS idx_listings_title_fts
  ON listings USING gin(to_tsvector('english', COALESCE(title, '')));

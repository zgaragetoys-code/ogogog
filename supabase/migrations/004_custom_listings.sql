-- Custom listings: items not tied to a card in the catalog.
-- Examples: accessories, storage, damaged lots, misc items.

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

CREATE TYPE condition_generic AS ENUM (
  'new',
  'like_new',
  'used',
  'damaged'
);

CREATE TABLE custom_listings (
  id                uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             text            NOT NULL,
  description       text            NOT NULL,
  custom_category   custom_category NOT NULL,
  condition_generic condition_generic NOT NULL,
  listing_type      listing_type    NOT NULL,
  price_type        price_type_enum NOT NULL,
  price             numeric(10,2),
  notes             text,
  photo_links       text[]          NOT NULL DEFAULT '{}',
  photo_notes       text,
  is_featured       boolean         NOT NULL DEFAULT false,
  featured_until    timestamptz,
  status            listing_status  NOT NULL DEFAULT 'active',
  created_at        timestamptz     NOT NULL DEFAULT now(),
  updated_at        timestamptz     NOT NULL DEFAULT now(),

  CONSTRAINT custom_title_length
    CHECK (char_length(title) BETWEEN 1 AND 100),

  CONSTRAINT custom_price_required
    CHECK (price_type = 'open_to_offers' OR price IS NOT NULL)
);

CREATE INDEX idx_custom_listings_user_id    ON custom_listings(user_id);
CREATE INDEX idx_custom_listings_status     ON custom_listings(status);
CREATE INDEX idx_custom_listings_created_at ON custom_listings(created_at DESC);

CREATE TRIGGER set_custom_listings_updated_at
  BEFORE UPDATE ON custom_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE custom_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_listings_public_read"
  ON custom_listings FOR SELECT USING (true);
CREATE POLICY "custom_listings_owner_insert"
  ON custom_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custom_listings_owner_update"
  ON custom_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "custom_listings_owner_delete"
  ON custom_listings FOR DELETE USING (auth.uid() = user_id);

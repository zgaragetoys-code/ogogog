-- ================================================================
-- Pokemon TCG Marketplace — Initial Schema
-- Paste the entire contents of this file into:
--   Supabase dashboard → SQL Editor → New query → Run
-- ================================================================


-- ----------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------

CREATE TYPE product_type AS ENUM (
  'single_card',
  'booster_pack',
  'booster_box',
  'etb',
  'tin',
  'collection_box',
  'theme_deck',
  'starter_deck',
  'bundle',
  'promo_pack',
  'master_set',
  'other_sealed',
  'other'
);

CREATE TYPE listing_type AS ENUM (
  'for_sale',
  'wanted'
);

CREATE TYPE listing_status AS ENUM (
  'active',
  'pending',
  'sold',
  'cancelled'
);

CREATE TYPE condition_type AS ENUM (
  'raw',      -- ungraded single card
  'graded',   -- slabbed by a grading company
  'sealed'    -- sealed product (pack, box, ETB, etc.)
);

-- Condition grades for raw (ungraded) single cards
CREATE TYPE raw_condition AS ENUM (
  'NM',   -- Near Mint
  'LP',   -- Lightly Played
  'MP',   -- Moderately Played
  'HP',   -- Heavily Played
  'DMG'   -- Damaged
);

-- Condition grades for sealed products
CREATE TYPE sealed_condition AS ENUM (
  'factory_sealed',
  'sealed_no_outer_wrap',
  'opened_contents_sealed',
  'opened_partial',
  'damaged'
);

-- Third-party grading companies
CREATE TYPE grading_company AS ENUM (
  'PSA',
  'CGC',
  'BGS',
  'SGC'
);

-- For master set listings only
CREATE TYPE master_set_completion AS ENUM (
  '100_percent',
  'near_complete',
  'partial'
);


-- ----------------------------------------------------------------
-- Card catalog
-- Populated by the import script — never written by users.
-- Set info is denormalized here; there is no separate sets table.
-- ----------------------------------------------------------------

CREATE TABLE cards (
  id            text         PRIMARY KEY,  -- TCGdex id e.g. 'swsh1-1'
  name          text         NOT NULL,
  set_name      text         NOT NULL,     -- e.g. 'Sword & Shield'
  set_code      text         NOT NULL,     -- e.g. 'swsh1'
  card_number   text         NOT NULL,     -- local id within set e.g. '001'
  rarity        text,
  image_url     text,
  release_date  date,
  language      text         NOT NULL DEFAULT 'en',
  product_type  product_type NOT NULL DEFAULT 'single_card',
  created_at    timestamptz  DEFAULT now()
);

CREATE INDEX idx_cards_set_code     ON cards(set_code);
CREATE INDEX idx_cards_product_type ON cards(product_type);
CREATE INDEX idx_cards_name_fts     ON cards USING gin(to_tsvector('english', name));


-- ----------------------------------------------------------------
-- User profiles
-- One row per user — auto-created on signup via trigger below.
-- ----------------------------------------------------------------

CREATE TABLE profiles (
  id                  uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            text        UNIQUE,
  avatar_url          text,
  bio                 text,
  -- Ratings stored as running totals; average = total / count
  seller_rating_total integer     NOT NULL DEFAULT 0,
  seller_rating_count integer     NOT NULL DEFAULT 0,
  buyer_rating_total  integer     NOT NULL DEFAULT 0,
  buyer_rating_count  integer     NOT NULL DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Auto-create a profile row whenever a new auth user is confirmed
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ----------------------------------------------------------------
-- Listings
-- ----------------------------------------------------------------

CREATE TABLE listings (
  id            uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id       text             NOT NULL REFERENCES cards(id),

  listing_type  listing_type     NOT NULL,
  status        listing_status   NOT NULL DEFAULT 'active',

  -- Condition: exactly one of the three types, with corresponding detail field
  condition_type    condition_type,
  raw_condition     raw_condition,     -- set when condition_type = 'raw'
  sealed_condition  sealed_condition,  -- set when condition_type = 'sealed'

  -- Grading: required when condition_type = 'graded'; also allowed on sealed items
  -- (e.g. a CGC-graded booster box)
  grading_company   grading_company,
  grade             numeric(4,1),      -- 1.0–10.0; supports half-grades e.g. 9.5

  price         numeric(10,2),
  notes         text,                  -- unlimited length; included in full-text search

  -- Photos: external URLs only (no uploads)
  photo_links   text[]  NOT NULL DEFAULT '{}',
  photo_notes   text,

  -- Master set fields; application enforces these only apply when
  -- the referenced card's product_type = 'master_set'
  master_set_completion      master_set_completion,
  master_set_included_cards  text,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),


  -- ---- Integrity constraints ----

  -- for_sale listings must always have a price and a condition_type
  CONSTRAINT for_sale_requires_price
    CHECK (listing_type != 'for_sale' OR price IS NOT NULL),
  CONSTRAINT for_sale_requires_condition
    CHECK (listing_type != 'for_sale' OR condition_type IS NOT NULL),

  -- raw_condition is only valid for raw condition_type
  CONSTRAINT raw_condition_matches_type
    CHECK (raw_condition IS NULL OR condition_type = 'raw'),

  -- raw condition_type requires raw_condition
  CONSTRAINT raw_type_needs_condition
    CHECK (condition_type != 'raw' OR raw_condition IS NOT NULL),

  -- sealed_condition is only valid for sealed condition_type
  CONSTRAINT sealed_condition_matches_type
    CHECK (sealed_condition IS NULL OR condition_type = 'sealed'),

  -- sealed condition_type requires sealed_condition
  CONSTRAINT sealed_type_needs_condition
    CHECK (condition_type != 'sealed' OR sealed_condition IS NOT NULL),

  -- grading fields must be provided together or not at all
  CONSTRAINT grading_fields_together
    CHECK (
      (grading_company IS NULL AND grade IS NULL) OR
      (grading_company IS NOT NULL AND grade IS NOT NULL)
    ),

  -- graded condition_type requires grading fields
  CONSTRAINT graded_type_needs_fields
    CHECK (condition_type != 'graded' OR (grading_company IS NOT NULL AND grade IS NOT NULL)),

  -- raw cards cannot have grading fields
  -- (graded sealed products are allowed: sealed_condition + grading_company + grade)
  CONSTRAINT no_grading_on_raw
    CHECK (condition_type != 'raw' OR (grading_company IS NULL AND grade IS NULL)),

  -- grade must be within valid range
  CONSTRAINT grade_valid_range
    CHECK (grade IS NULL OR (grade >= 1.0 AND grade <= 10.0))
);

CREATE INDEX idx_listings_card_id    ON listings(card_id);
CREATE INDEX idx_listings_user_id    ON listings(user_id);
CREATE INDEX idx_listings_status     ON listings(status);
CREATE INDEX idx_listings_type       ON listings(listing_type);
CREATE INDEX idx_listings_condition  ON listings(condition_type);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);

-- Full-text search on notes
CREATE INDEX idx_listings_notes_fts
  ON listings USING gin(to_tsvector('english', COALESCE(notes, '')));

-- Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ----------------------------------------------------------------
-- Messages
-- Card-scoped threads: one conversation per (listing, user pair).
-- ----------------------------------------------------------------

CREATE TABLE messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  created_at  timestamptz DEFAULT now(),
  read_at     timestamptz   -- null = unread
);

CREATE INDEX idx_messages_listing_id   ON messages(listing_id);
CREATE INDEX idx_messages_sender_id    ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id  ON messages(receiver_id);


-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------

ALTER TABLE cards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;

-- cards: public read; writes come only from the import script (service role bypasses RLS)
CREATE POLICY "cards_public_read"
  ON cards FOR SELECT USING (true);

-- profiles: public read; each user updates only their own row
CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- listings: public read; authenticated users manage only their own
CREATE POLICY "listings_public_read"
  ON listings FOR SELECT USING (true);
CREATE POLICY "listings_owner_insert"
  ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_owner_update"
  ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "listings_owner_delete"
  ON listings FOR DELETE USING (auth.uid() = user_id);

-- messages: only the sender and receiver can read or write
CREATE POLICY "messages_participant_read"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_sender_insert"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

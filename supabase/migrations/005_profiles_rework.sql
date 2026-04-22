-- ================================================================
-- Migration 005: Rework profiles table for user profile feature
--
-- Safe to re-run:
--   - DROP COLUMN IF EXISTS for removed columns
--   - ADD COLUMN IF NOT EXISTS for new columns
--   - DO/EXCEPTION blocks for enum and constraint creation
-- ================================================================


-- ----------------------------------------------------------------
-- 1. Avatar style enum
-- ----------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE avatar_style_enum AS ENUM (
    'adventurer',
    'avataaars',
    'bottts',
    'fun-emoji',
    'identicon',
    'lorelei',
    'pixel-art',
    'shapes',
    'thumbs',
    'big-smile'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------
-- 2. Remove old columns no longer part of the schema
-- ----------------------------------------------------------------

ALTER TABLE profiles
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS seller_rating_total,
  DROP COLUMN IF EXISTS seller_rating_count,
  DROP COLUMN IF EXISTS buyer_rating_total,
  DROP COLUMN IF EXISTS buyer_rating_count;


-- ----------------------------------------------------------------
-- 3. Add new columns
-- ----------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name      text,
  ADD COLUMN IF NOT EXISTS avatar_seed       text,
  ADD COLUMN IF NOT EXISTS avatar_style      avatar_style_enum,
  ADD COLUMN IF NOT EXISTS country           char(2),
  ADD COLUMN IF NOT EXISTS region            text,
  ADD COLUMN IF NOT EXISTS notes             text,
  ADD COLUMN IF NOT EXISTS collectr_url      text,
  ADD COLUMN IF NOT EXISTS facebook_url      text,
  ADD COLUMN IF NOT EXISTS instagram_url     text,
  ADD COLUMN IF NOT EXISTS ebay_username     text,
  ADD COLUMN IF NOT EXISTS discord_username  text,
  ADD COLUMN IF NOT EXISTS tcgplayer_url     text,
  ADD COLUMN IF NOT EXISTS website_url       text;


-- ----------------------------------------------------------------
-- 4. Constraints
-- ----------------------------------------------------------------

-- Username: 3-30 chars, alphanumeric + underscore/hyphen only
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_username_format
    CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]{3,30}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Display name: 1-50 chars when set
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_length
    CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 50);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notes: max 2000 chars
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_notes_length
    CHECK (notes IS NULL OR char_length(notes) <= 2000);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ----------------------------------------------------------------
-- 5. Backfill existing rows
-- ----------------------------------------------------------------

-- Give existing users an avatar_seed (their user ID) if not set
UPDATE profiles
  SET avatar_seed = id::text
  WHERE avatar_seed IS NULL;

-- Give existing users a random avatar_style if not set
UPDATE profiles
  SET avatar_style = (
    ARRAY[
      'adventurer', 'avataaars', 'bottts', 'fun-emoji', 'identicon',
      'lorelei', 'pixel-art', 'shapes', 'thumbs', 'big-smile'
    ]::avatar_style_enum[]
  )[floor(random() * 10 + 1)::int]
  WHERE avatar_style IS NULL;


-- ----------------------------------------------------------------
-- 6. Update signup trigger to seed avatar on new user creation
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  styles avatar_style_enum[] := ARRAY[
    'adventurer', 'avataaars', 'bottts', 'fun-emoji', 'identicon',
    'lorelei', 'pixel-art', 'shapes', 'thumbs', 'big-smile'
  ]::avatar_style_enum[];
BEGIN
  INSERT INTO public.profiles (id, avatar_seed, avatar_style)
  VALUES (
    NEW.id,
    NEW.id::text,
    styles[floor(random() * array_length(styles, 1) + 1)::int]
  );
  RETURN NEW;
END;
$$;

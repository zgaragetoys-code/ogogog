-- Add 'sealed_product' to the custom_category enum.
-- Run in Supabase SQL Editor.

ALTER TYPE custom_category ADD VALUE IF NOT EXISTS 'sealed_product';

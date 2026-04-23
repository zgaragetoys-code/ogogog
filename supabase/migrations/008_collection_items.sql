CREATE TABLE collection_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users NOT NULL,
  card_id    text REFERENCES cards NOT NULL,
  quantity   integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  for_sale   boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, card_id)
);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view collections (public)
CREATE POLICY "collection_items_read_all"
  ON collection_items FOR SELECT
  USING (true);

CREATE POLICY "collection_items_insert_own"
  ON collection_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collection_items_update_own"
  ON collection_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "collection_items_delete_own"
  ON collection_items FOR DELETE
  USING (auth.uid() = user_id);

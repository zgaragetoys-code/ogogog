-- Allow receivers to mark messages as read (update read_at only)
CREATE POLICY "messages_receiver_update"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

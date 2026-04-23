-- Add condition tracking to collection items
-- Allows users to record the condition of each card in their collection

ALTER TABLE collection_items
  ADD COLUMN condition_type  condition_type,
  ADD COLUMN raw_condition   raw_condition,
  ADD COLUMN grading_company grading_company,
  ADD COLUMN grade           numeric(4,1),
  ADD COLUMN notes           text;

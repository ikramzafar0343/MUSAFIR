ALTER TABLE sales_order_item
  ADD COLUMN IF NOT EXISTS customization jsonb;

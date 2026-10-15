ALTER TABLE product
  ADD COLUMN IF NOT EXISTS tile_color text
  CHECK (tile_color IS NULL OR tile_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE product DROP CONSTRAINT IF EXISTS product_category_check;

ALTER TABLE product
  ADD CONSTRAINT product_category_check
  CHECK (category IN (
    'new-arrivals',
    'saddles',
    'bridles',
    'halters',
    'care',
    'engraved-saddles',
    'western-saddles',
    'crystal-rhinestone',
    'studded-leather',
    'custom-colors',
    'personalized',
    'complete-sets',
    'tack-accessories',
    'serums',
    'creams',
    'cleansers',
    'body-care'
  ));

ALTER TABLE product
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

UPDATE product SET categories = ARRAY[category] WHERE cardinality(categories) = 0;

ALTER TABLE product DROP CONSTRAINT IF EXISTS product_categories_check;

ALTER TABLE product
  ADD CONSTRAINT product_categories_check
  CHECK (categories <@ ARRAY[
    'new-arrivals',
    'saddles',
    'bridles',
    'halters',
    'care',
    'engraved-saddles',
    'western-saddles',
    'crystal-rhinestone',
    'studded-leather',
    'custom-colors',
    'personalized',
    'complete-sets',
    'tack-accessories',
    'serums',
    'creams',
    'cleansers',
    'body-care'
  ]::text[]);

CREATE INDEX IF NOT EXISTS product_categories_idx ON product USING gin (categories);

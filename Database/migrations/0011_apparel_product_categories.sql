-- MUSAFIR menswear taxonomy: replace equestrian product categories.

-- Clear obsolete category assignments (no fabricated saddle→blazer remaps).
UPDATE product
SET category = 'new-arrivals',
    categories = ARRAY['new-arrivals']::text[],
    status = CASE WHEN status = 'published' THEN 'draft' ELSE status END,
    updated_at = NOW()
WHERE category IS NOT NULL
  AND category NOT IN (
    'new-arrivals',
    'coats-blazers',
    'shirts',
    'trousers',
    'shoes',
    'matching-pairs'
  );

UPDATE product
SET categories = ARRAY(
  SELECT unnest(categories)
  INTERSECT
  SELECT unnest(ARRAY[
    'new-arrivals',
    'coats-blazers',
    'shirts',
    'trousers',
    'shoes',
    'matching-pairs'
  ]::text[])
),
updated_at = NOW()
WHERE categories IS NOT NULL;

UPDATE product
SET categories = ARRAY['new-arrivals']::text[],
    updated_at = NOW()
WHERE categories IS NULL OR cardinality(categories) = 0;

ALTER TABLE product DROP CONSTRAINT IF EXISTS product_category_check;
ALTER TABLE product
  ADD CONSTRAINT product_category_check
  CHECK (
    category IN (
      'new-arrivals',
      'coats-blazers',
      'shirts',
      'trousers',
      'shoes',
      'matching-pairs'
    )
  );

ALTER TABLE product DROP CONSTRAINT IF EXISTS product_categories_check;
ALTER TABLE product
  ADD CONSTRAINT product_categories_check
  CHECK (
    categories <@ ARRAY[
      'new-arrivals',
      'coats-blazers',
      'shirts',
      'trousers',
      'shoes',
      'matching-pairs'
    ]::text[]
  );

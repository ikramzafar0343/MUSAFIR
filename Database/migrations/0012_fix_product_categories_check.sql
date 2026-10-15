-- 0011 was recorded as applied, but product_categories_check on some DBs still
-- listed equestrian/skincare slugs. Re-assert the menswear allow-list.

UPDATE product
SET categories = ARRAY(
  SELECT unnest(COALESCE(categories, ARRAY[]::text[]))
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
updated_at = NOW();

UPDATE product
SET categories = ARRAY[COALESCE(NULLIF(category, ''), 'new-arrivals')]::text[],
    updated_at = NOW()
WHERE categories IS NULL OR cardinality(categories) = 0;

UPDATE product
SET category = 'new-arrivals',
    updated_at = NOW()
WHERE category IS NULL
   OR category NOT IN (
     'new-arrivals',
     'coats-blazers',
     'shirts',
     'trousers',
     'shoes',
     'matching-pairs'
   );

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

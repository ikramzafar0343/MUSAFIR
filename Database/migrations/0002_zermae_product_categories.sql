ALTER TABLE product DROP CONSTRAINT IF EXISTS product_category_check;

UPDATE product SET category = 'serums' WHERE category = 'summer';
UPDATE product SET category = 'creams' WHERE category IN ('ready-to-wear', 'festive');
UPDATE product SET category = 'cleansers' WHERE category = 'unstitched';
UPDATE product SET category = 'body-care' WHERE category = 'bridal';

ALTER TABLE product
  ADD CONSTRAINT product_category_check
  CHECK (category IN ('new-arrivals', 'serums', 'creams', 'cleansers', 'body-care'));

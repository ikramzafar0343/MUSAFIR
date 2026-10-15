alter table product drop constraint if exists product_category_check;

alter table product
  add constraint product_category_check
  check (category in (
    'new-arrivals',
    'saddles',
    'bridles',
    'halters',
    'care',
    'serums',
    'creams',
    'cleansers',
    'body-care'
  ));

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER')),
  is_email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text,
  email_verification_expires timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  admin_login_challenge_id text,
  admin_login_otp_hash text,
  admin_login_otp_expires timestamptz,
  last_login_at timestamptz,
  avatar_url text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX account_email_active_idx ON account (email) WHERE deleted_at IS NULL;
CREATE INDEX account_role_idx ON account (role) WHERE deleted_at IS NULL;

CREATE TRIGGER account_set_updated_at
BEFORE UPDATE ON account
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL,
  account_id uuid NOT NULL REFERENCES account (id) ON DELETE CASCADE ON UPDATE CASCADE,
  expires_at timestamptz NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX session_token_hash_idx ON session (token_hash);
CREATE INDEX session_account_expires_idx ON session (account_id, expires_at);
CREATE INDEX session_expires_at_idx ON session (expires_at);

CREATE TRIGGER session_set_updated_at
BEFORE UPDATE ON session
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE nonce (
  nonce_value text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX nonce_expires_at_idx ON nonce (expires_at);

CREATE TABLE rate_limit_bucket (
  bucket_key text PRIMARY KEY,
  tokens numeric(12, 4) NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  refill_per_second numeric(12, 6) NOT NULL CHECK (refill_per_second > 0),
  last_refill_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER rate_limit_bucket_set_updated_at
BEFORE UPDATE ON rate_limit_bucket
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  slug text NOT NULL,
  sku text NOT NULL,
  category text NOT NULL CHECK (category IN ('new-arrivals', 'serums', 'creams', 'cleansers', 'body-care')),
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  original_price numeric(12, 2) CHECK (original_price IS NULL OR original_price >= 0),
  discount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  description_intro text NOT NULL DEFAULT '',
  description_detail text NOT NULL DEFAULT '',
  description_highlights text[] NOT NULL DEFAULT '{}',
  spec_composition text NOT NULL DEFAULT '',
  spec_care text NOT NULL DEFAULT '',
  spec_includes text NOT NULL DEFAULT '',
  return_policy text NOT NULL DEFAULT '',
  sizes text[] NOT NULL DEFAULT '{}',
  best_seller boolean NOT NULL DEFAULT false,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  rating numeric(3, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX product_slug_active_idx ON product (slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX product_sku_active_idx ON product (sku) WHERE deleted_at IS NULL;
CREATE INDEX product_category_status_idx ON product (category, status) WHERE deleted_at IS NULL;
CREATE INDEX product_best_seller_idx ON product (best_seller, status) WHERE deleted_at IS NULL;
CREATE INDEX product_status_stock_idx ON product (status, stock) WHERE deleted_at IS NULL;
CREATE INDEX product_created_at_id_idx ON product (created_at DESC, id DESC);

CREATE TRIGGER product_set_updated_at
BEFORE UPDATE ON product
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_image (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES product (id) ON DELETE CASCADE ON UPDATE CASCADE,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX product_image_product_idx ON product_image (product_id, sort_order);

CREATE TRIGGER product_image_set_updated_at
BEFORE UPDATE ON product_image
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_color (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES product (id) ON DELETE CASCADE ON UPDATE CASCADE,
  name text NOT NULL,
  hex text NOT NULL CHECK (hex ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX product_color_product_idx ON product_color (product_id);

CREATE TRIGGER product_color_set_updated_at
BEFORE UPDATE ON product_color
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sales_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  account_id uuid REFERENCES account (id) ON DELETE SET NULL ON UPDATE CASCADE,
  customer text NOT NULL CHECK (char_length(customer) BETWEEN 2 AND 120),
  email text NOT NULL,
  phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postal_code text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'online')),
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee numeric(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  tax_rate numeric(6, 2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
  tax_label text NOT NULL DEFAULT 'GST',
  total numeric(12, 2) NOT NULL CHECK (total >= 0),
  notes text,
  cancelled_at timestamptz,
  cancellation_reason text,
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX sales_order_number_active_idx ON sales_order (order_number) WHERE deleted_at IS NULL;
CREATE INDEX sales_order_account_created_idx ON sales_order (account_id, created_at DESC);
CREATE INDEX sales_order_status_created_idx ON sales_order (status, created_at DESC);
CREATE INDEX sales_order_email_created_idx ON sales_order (email, created_at DESC);

CREATE TRIGGER sales_order_set_updated_at
BEFORE UPDATE ON sales_order
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sales_order_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES sales_order (id) ON DELETE CASCADE ON UPDATE CASCADE,
  product_id uuid NOT NULL REFERENCES product (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  name text NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity >= 1),
  size text,
  color text,
  color_hex text,
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX sales_order_item_order_idx ON sales_order_item (sales_order_id);

CREATE TRIGGER sales_order_item_set_updated_at
BEFORE UPDATE ON sales_order_item
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE newsletter_subscriber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'footer',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX newsletter_subscriber_email_idx ON newsletter_subscriber (email);

CREATE TRIGGER newsletter_subscriber_set_updated_at
BEFORE UPDATE ON newsletter_subscriber
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE storefront_setting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  published boolean NOT NULL DEFAULT true,
  currency text NOT NULL,
  standard_shipping_fee numeric(12, 2) NOT NULL CHECK (standard_shipping_fee >= 0),
  free_shipping_threshold numeric(12, 2) NOT NULL CHECK (free_shipping_threshold >= 0),
  free_shipping_enabled boolean NOT NULL,
  tax_enabled boolean NOT NULL,
  tax_rate numeric(6, 2) NOT NULL CHECK (tax_rate >= 0),
  tax_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX storefront_setting_key_idx ON storefront_setting (setting_key);

CREATE TRIGGER storefront_setting_set_updated_at
BEFORE UPDATE ON storefront_setting
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE idempotency_key (
  key_value text PRIMARY KEY,
  request_hash text NOT NULL,
  response_body jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idempotency_key_expires_at_idx ON idempotency_key (expires_at);

INSERT INTO storefront_setting (
  setting_key,
  published,
  currency,
  standard_shipping_fee,
  free_shipping_threshold,
  free_shipping_enabled,
  tax_enabled,
  tax_rate,
  tax_label
) VALUES (
  'default',
  true,
  'USD',
  15,
  150,
  true,
  false,
  0,
  'Tax'
);

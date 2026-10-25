-- Seller banner templates + banners

CREATE TABLE IF NOT EXISTS "banner_templates" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bg_url"      TEXT NOT NULL,
  "preview_url" TEXT,
  "name_uz"     VARCHAR(80),
  "name_ru"     VARCHAR(80),
  "text_style"  VARCHAR(16) NOT NULL DEFAULT 'light',
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "seller_banners" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id"        UUID NOT NULL REFERENCES "sellers"("id") ON DELETE CASCADE,
  "template_id"      UUID REFERENCES "banner_templates"("id"),
  "custom_image_url" TEXT,
  "title"            VARCHAR(80),
  "subtitle"         VARCHAR(160),
  "product_id"       UUID,
  "cta_label_uz"     VARCHAR(40),
  "cta_label_ru"     VARCHAR(40),
  "is_active"        BOOLEAN NOT NULL DEFAULT false,
  "is_approved"      BOOLEAN NOT NULL DEFAULT false,
  "start_at"         TIMESTAMP(3),
  "end_at"           TIMESTAMP(3),
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "seller_banners_seller_active_idx" ON "seller_banners" ("seller_id", "is_active");
CREATE INDEX IF NOT EXISTS "seller_banners_active_approved_idx" ON "seller_banners" ("is_active", "is_approved", "start_at");

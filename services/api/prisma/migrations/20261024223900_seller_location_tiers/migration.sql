-- Phase 1: Shop profile extensions — country, district, TOP/Premium tiers
ALTER TABLE "sellers"
  ADD COLUMN IF NOT EXISTS "country" VARCHAR(80) DEFAULT 'Uzbekistan',
  ADD COLUMN IF NOT EXISTS "district" VARCHAR(120),
  ADD COLUMN IF NOT EXISTS "is_top" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_premium" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "sellers_city_district_idx" ON "sellers" ("city", "district");
CREATE INDEX IF NOT EXISTS "sellers_tier_idx" ON "sellers" ("is_premium", "is_top", "verified");

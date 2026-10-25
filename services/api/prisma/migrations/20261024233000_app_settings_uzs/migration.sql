-- Phase 8: UZS rate — singleton settings table

CREATE TABLE IF NOT EXISTS "app_settings" (
  "id"             TEXT PRIMARY KEY DEFAULT 'singleton',
  "usd_to_uzs_rate" DECIMAL(12,2) NOT NULL DEFAULT 12500,
  "updated_by"     UUID,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "app_settings" ("id", "usd_to_uzs_rate")
VALUES ('singleton', 12500)
ON CONFLICT ("id") DO NOTHING;

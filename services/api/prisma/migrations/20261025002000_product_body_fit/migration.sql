-- Product body-fit segmentation (slim / regular / plus)

DO $$ BEGIN
  CREATE TYPE "BodyFit" AS ENUM ('slim', 'regular', 'plus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "body_fit" "BodyFit";

CREATE INDEX IF NOT EXISTS "products_category_body_fit_idx"
  ON "products" ("category_id", "body_fit");

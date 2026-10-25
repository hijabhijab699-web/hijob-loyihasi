-- Phase 7: Seller paid subscriptions

DO $$ BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('monthly', 'halfyear', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "seller_subscriptions" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "seller_id"     UUID NOT NULL REFERENCES "sellers"("id") ON DELETE CASCADE,
  "plan"          "SubscriptionPlan" NOT NULL,
  "status"        "SubscriptionStatus" NOT NULL DEFAULT 'pending',
  "price_usd"     INTEGER NOT NULL,
  "price_uzs"     BIGINT,
  "start_at"      TIMESTAMP(3),
  "end_at"        TIMESTAMP(3),
  "activated_by"  UUID,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "seller_subscriptions_seller_status_idx" ON "seller_subscriptions" ("seller_id", "status");
CREATE INDEX IF NOT EXISTS "seller_subscriptions_status_end_idx" ON "seller_subscriptions" ("status", "end_at");

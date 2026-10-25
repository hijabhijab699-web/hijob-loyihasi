-- Phase 11: Agent role + shop onboarding attribution

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'agent';

ALTER TABLE "sellers"
  ADD COLUMN IF NOT EXISTS "onboarded_by_agent_id" UUID;

CREATE INDEX IF NOT EXISTS "sellers_onboarded_by_agent_idx" ON "sellers" ("onboarded_by_agent_id");

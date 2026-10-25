-- Phase 1.1: Customer profile avatar
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

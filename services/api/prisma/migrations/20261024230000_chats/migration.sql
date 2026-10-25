-- Phase 5.2: buyer <-> seller chats

DO $$ BEGIN
  CREATE TYPE "ChatMessageKind" AS ENUM ('text', 'product', 'payment_link', 'receipt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "chats" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "buyer_user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "seller_id"         UUID NOT NULL REFERENCES "sellers"("id") ON DELETE CASCADE,
  "last_message_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "buyer_unread"      INTEGER NOT NULL DEFAULT 0,
  "seller_unread"     INTEGER NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chats_buyer_seller_key" UNIQUE ("buyer_user_id", "seller_id")
);

CREATE INDEX IF NOT EXISTS "chats_buyer_last_message_idx" ON "chats" ("buyer_user_id", "last_message_at");
CREATE INDEX IF NOT EXISTS "chats_seller_last_message_idx" ON "chats" ("seller_id", "last_message_at");

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chat_id"    UUID NOT NULL REFERENCES "chats"("id") ON DELETE CASCADE,
  "sender_id"  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind"       "ChatMessageKind" NOT NULL DEFAULT 'text',
  "body"       TEXT NOT NULL,
  "payload"    JSONB,
  "read_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "chat_messages_chat_created_idx" ON "chat_messages" ("chat_id", "created_at");

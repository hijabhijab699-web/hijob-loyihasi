-- Add 'abaya' value to CategoryId enum.
-- Must be committed before any transaction can USE the new value
-- (Postgres restriction), so we commit here and the seller DTO/service
-- can start accepting the new category afterwards.

ALTER TYPE "CategoryId" ADD VALUE IF NOT EXISTS 'abaya' AFTER 'dresses';

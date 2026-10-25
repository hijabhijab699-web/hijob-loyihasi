-- Phase 1: Add shoes category enum value
ALTER TYPE "CategoryId" ADD VALUE IF NOT EXISTS 'shoes';

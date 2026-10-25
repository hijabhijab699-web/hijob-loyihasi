-- Phase 5.3: Bron qilish + saqlab turish
ALTER TYPE "DeliveryType" ADD VALUE IF NOT EXISTS 'reserve';
ALTER TYPE "DeliveryType" ADD VALUE IF NOT EXISTS 'hold';

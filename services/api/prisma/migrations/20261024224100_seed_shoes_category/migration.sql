-- Phase 1: Seed shoes category row (runs after the enum add)
INSERT INTO "categories" ("id", "name_uz", "name_ru", "name_en", "order")
VALUES ('shoes', 'Poyabzallar', 'Обувь', 'Shoes', 30)
ON CONFLICT ("id") DO NOTHING;

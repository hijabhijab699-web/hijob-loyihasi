-- Seed the Category row for 'abaya' so that products with
-- categoryId = 'abaya' satisfy the FK into categories(id).
-- The enum value itself was added in 20261102000000_category_abaya.

INSERT INTO categories (id, name_uz, name_ru, name_en, "order")
VALUES ('abaya', 'Abayalar', 'Абайи', 'Abayas', 3)
ON CONFLICT (id) DO NOTHING;

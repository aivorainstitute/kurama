-- ============================================================
-- FIX: TAMBAH CATEGORY_NAME KE MENU_ITEMS
-- ============================================================

-- Cara 1: Tambah kolom category_name (kalau mau simpan di tabel)
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_name VARCHAR(100);

-- Update data existing dengan nama kategori
UPDATE menu_items 
SET category_name = c.name
FROM categories c
WHERE menu_items.category_id = c.id;

-- ============================================================
-- Cara 2: Buat View (Lebih bagus, data selalu sync)
-- ============================================================
DROP VIEW IF EXISTS menu_items_view;

CREATE VIEW menu_items_view AS
SELECT 
    m.id,
    m.name,
    m.description,
    m.price,
    m.image_url,
    m.category_id,
    c.name as category_name,
    m.stock,
    m.is_available,
    m.is_popular,
    m.created_at,
    m.updated_at
FROM menu_items m
LEFT JOIN categories c ON m.category_id = c.id;

-- Grant permissions
GRANT SELECT ON menu_items_view TO anon, authenticated;

-- Verifikasi
SELECT 'Fix complete!' as status;
SELECT * FROM menu_items_view LIMIT 3;

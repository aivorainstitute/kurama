-- ============================================================
-- FIX KATEGORI - PASTIKAN CATEGORY_NAME TERISI
-- ============================================================

-- 1. Update menu_items yang category_name-nya NULL atau kosong
UPDATE menu_items 
SET category_name = c.name
FROM categories c
WHERE menu_items.category_id = c.id 
  AND (menu_items.category_name IS NULL OR menu_items.category_name = '');

-- 2. Verifikasi data
SELECT 
    m.id,
    m.name,
    m.category_id,
    c.name as category_from_join,
    m.category_name,
    CASE 
        WHEN m.category_name IS NULL THEN 'NULL'
        WHEN m.category_name = '' THEN 'EMPTY'
        ELSE 'OK'
    END as status
FROM menu_items m
LEFT JOIN categories c ON m.category_id = c.id;

-- 3. Cek distinct categories
SELECT DISTINCT category_name, COUNT(*) as count
FROM menu_items
GROUP BY category_name;

-- 4. Kalau ada yang masih NULL/EMPTY, set default
UPDATE menu_items 
SET category_name = 'Lainnya'
WHERE category_name IS NULL OR category_name = '';

SELECT 'Category fix complete!' as status;

-- ============================================================
-- TAMBAH KOLOM IMAGE_URL KE ORDER_ITEMS
-- ============================================================

-- Tambah kolom image_url
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Verifikasi
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items';

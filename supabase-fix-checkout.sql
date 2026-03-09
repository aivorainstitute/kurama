-- ============================================================
-- FIX CHECKOUT ERROR
-- ============================================================

-- 1. Pastikan kolom image_url ada di order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Cek struktur tabel orders
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders';

-- 3. Cek struktur tabel order_items
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'order_items';

-- 4. Test insert order (untuk debug)
-- INSERT INTO orders (order_number, customer_name, status, subtotal, tax_amount, total_amount)
-- VALUES ('TEST-001', 'Test User', 'BARU', 10000, 1000, 11000)
-- RETURNING *;

-- 5. Verifikasi RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items');

-- 6. Grant permissions lagi untuk memastikan
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE orders_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE order_items_id_seq TO anon, authenticated;

SELECT 'Checkout fix applied!' as status;

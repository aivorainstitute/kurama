-- ============================================================
-- CLEAN ZERO - DATABASE SETUP LENGKAP
-- Jalankan ini di Supabase SQL Editor (urut dari atas ke bawah)
-- ============================================================

-- ============================================================
-- STEP 1: HAPUS SEMUA YANG LAMA (Kalau ada)
-- ============================================================
DROP VIEW IF EXISTS order_summary CASCADE;
DROP FUNCTION IF EXISTS set_order_numbers() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_queue_number() CASCADE;
DROP TRIGGER IF EXISTS before_insert_order ON orders;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================================================
-- STEP 2: BUAT TABEL KATEGORI
-- ============================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert data kategori awal
INSERT INTO categories (name) VALUES 
    ('Signatures'),
    ('Coffee'),
    ('Minuman'),
    ('Makanan');

-- ============================================================
-- STEP 3: BUAT TABEL MENU ITEMS
-- ============================================================
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image_url TEXT,
    category_id INTEGER REFERENCES categories(id),
    category_name VARCHAR(100), -- Tambah kolom nama kategori
    stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert menu sample (dengan category_name)
INSERT INTO menu_items (name, description, price, image_url, category_id, category_name, stock, is_available, is_popular) VALUES
('Matcha Latte', 'Premium ceremonial grade matcha with oat milk', 35000, 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3114?w=400', 1, 'Signatures', 50, true, true),
('Smashed Avo Toast', 'Sourdough with avocado and feta cheese', 45000, 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=400', 4, 'Makanan', 30, true, true),
('Caffe Latte', 'Double shot espresso with steamed milk', 30000, 'https://images.unsplash.com/photo-1570968992193-fd6dc66989ae?w=400', 2, 'Coffee', 100, true, false),
('Iced Americano', 'Double shot espresso over ice', 22000, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400', 2, 'Coffee', 80, true, false),
('Truffle Fries', 'Crispy fries with truffle oil', 35000, 'https://images.unsplash.com/photo-1573080496987-a199f8cd2e9a?w=400', 4, 'Makanan', 40, true, false),
('Beef Burger', 'Juicy beef patty with special sauce', 55000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 4, 'Makanan', 25, true, true);

-- ============================================================
-- STEP 4: BUAT TABEL ORDERS (Pesanan)
-- ============================================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    queue_number INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    table_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'BARU' CHECK (status IN ('BARU', 'DIPROSES', 'SIAP', 'SELESAI', 'DIBATALKAN')),
    subtotal INTEGER NOT NULL DEFAULT 0,
    tax_amount INTEGER NOT NULL DEFAULT 0,
    total_amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- STEP 5: BUAT TABEL ORDER ITEMS (Item per pesanan)
-- ============================================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL,
    notes TEXT,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 6: BUAT FUNCTION UNTUK GENERATE NOMOR ORDER
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    today VARCHAR(8);
BEGIN
    today := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    new_number := 'CZ-' || today || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 7: BUAT FUNCTION UNTUK GENERATE NOMOR ANTRIAN
-- ============================================================
CREATE OR REPLACE FUNCTION generate_queue_number()
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Cari nomor antrian tertinggi hari ini
    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_number
    FROM orders
    WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 8: BUAT TRIGGER UNTUK AUTO-SET ORDER NUMBER & QUEUE
-- ============================================================
CREATE OR REPLACE FUNCTION set_order_numbers()
RETURNS TRIGGER AS $$
BEGIN
    -- Kalau order_number kosong, generate baru
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    
    -- Kalau queue_number kosong, generate baru
    IF NEW.queue_number IS NULL OR NEW.queue_number = 0 THEN
        NEW.queue_number := generate_queue_number();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_order
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_numbers();

-- ============================================================
-- STEP 9: BUAT VIEW ORDER_SUMMARY (Untuk Dashboard)
-- ============================================================
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.queue_number,
    o.customer_name,
    o.status,
    o.total_amount,
    COALESCE(item_counts.item_count, 0) as item_count,
    o.created_at,
    o.table_number
FROM orders o
LEFT JOIN (
    SELECT order_id, COUNT(*) as item_count 
    FROM order_items 
    GROUP BY order_id
) item_counts ON o.id = item_counts.order_id
WHERE o.deleted_at IS NULL
ORDER BY o.created_at DESC;

-- ============================================================
-- STEP 10: SET RLS POLICIES (Row Level Security)
-- ============================================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories: Allow all
DROP POLICY IF EXISTS "categories_all" ON categories;
CREATE POLICY "categories_all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Menu Items: Allow all
DROP POLICY IF EXISTS "menu_items_all" ON menu_items;
CREATE POLICY "menu_items_all" ON menu_items FOR ALL USING (true) WITH CHECK (true);

-- Orders: Allow all
DROP POLICY IF EXISTS "orders_all" ON orders;
CREATE POLICY "orders_all" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order Items: Allow all
DROP POLICY IF EXISTS "order_items_all" ON order_items;
CREATE POLICY "order_items_all" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 11: GRANT PERMISSIONS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO anon, authenticated;
GRANT SELECT ON order_summary TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_order_number() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_queue_number() TO anon, authenticated;

-- ============================================================
-- STEP 12: ENABLE REALTIME (Supabase Realtime) - WITH CHECK
-- ============================================================
-- Hapus dulu kalau sudah ada, lalu tambahkan lagi
DO $$
BEGIN
    -- Cek dan hapus orders dari publication kalau sudah ada
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE orders;
    END IF;
    
    -- Cek dan hapus order_items dari publication kalau sudah ada
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'order_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE order_items;
    END IF;
    
    -- Cek dan hapus menu_items dari publication kalau sudah ada
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'menu_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE menu_items;
    END IF;
END $$;

-- Sekarang tambahkan ke publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;

-- ============================================================
-- STEP 13: VERIFIKASI (Cek apakah semua berhasil)
-- ============================================================
SELECT 'SETUP BERHASIL!' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_menu FROM menu_items;

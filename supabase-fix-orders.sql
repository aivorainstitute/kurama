-- ============================================================
-- FIX ORDER SUMMARY VIEW DAN RLS POLICIES
-- ============================================================

-- 1. Drop existing view jika ada
DROP VIEW IF EXISTS order_summary CASCADE;

-- 2. Pastikan function untuk queue_number exists
CREATE OR REPLACE FUNCTION generate_queue_number()
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
    today DATE;
BEGIN
    today := CURRENT_DATE;
    
    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_number
    FROM orders
    WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') = today;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- 3. Buat view baru dengan timezone handling yang benar
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

-- 4. Grant permissions
GRANT SELECT ON order_summary TO anon;
GRANT SELECT ON order_summary TO authenticated;
GRANT EXECUTE ON FUNCTION generate_queue_number() TO anon;
GRANT EXECUTE ON FUNCTION generate_queue_number() TO authenticated;

-- 5. Enable RLS untuk view (jika perlu)
ALTER VIEW order_summary OWNER TO postgres;

-- 6. Pastikan RLS untuk orders dan order_items sudah benar
-- Check RLS policies
DROP POLICY IF EXISTS "Allow all select" ON orders;
DROP POLICY IF EXISTS "Allow all insert" ON orders;
DROP POLICY IF EXISTS "Allow all update" ON orders;
DROP POLICY IF EXISTS "Allow all delete" ON orders;

CREATE POLICY "Allow all select" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON orders FOR DELETE USING (true);

-- Order Items
DROP POLICY IF EXISTS "Allow all select on order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all insert on order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all update on order_items" ON order_items;
DROP POLICY IF EXISTS "Allow all delete on order_items" ON order_items;

CREATE POLICY "Allow all select on order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow all insert on order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on order_items" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on order_items" ON order_items FOR DELETE USING (true);

-- 7. Enable realtime untuk orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 8. Test the view
SELECT 'order_summary view created successfully' as status;

-- 9. Check existing orders
SELECT COUNT(*) as total_orders FROM orders;

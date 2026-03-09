-- Fix queue_number untuk order yang sudah ada
-- Reset queue_number berdasarkan urutan created_at per hari

WITH numbered_orders AS (
  SELECT 
    id,
    created_at,
    DATE(created_at) as order_date,
    ROW_NUMBER() OVER (
      PARTITION BY DATE(created_at) 
      ORDER BY created_at ASC
    ) as new_queue_number
  FROM orders
)
UPDATE orders 
SET queue_number = numbered_orders.new_queue_number
FROM numbered_orders 
WHERE orders.id = numbered_orders.id;

-- Verifikasi
SELECT 
  id, 
  customer_name, 
  order_number, 
  queue_number, 
  created_at,
  DATE(created_at) as order_date
FROM orders 
ORDER BY DATE(created_at) DESC, queue_number ASC;

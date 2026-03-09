-- Tambah kolom payment_status ke orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'BELUM_BAYAR';

-- Constraint untuk payment_status (hapus dulu kalau sudah ada)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_payment_status;
ALTER TABLE orders ADD CONSTRAINT check_payment_status 
  CHECK (payment_status IN ('BELUM_BAYAR', 'SUDAH_BAYAR'));

-- Tambah kolom payment_method
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update existing orders yang masih NULL
UPDATE orders SET payment_status = 'BELUM_BAYAR' WHERE payment_status IS NULL;

-- Enable realtime (skip kalau sudah ada)
DO $$
BEGIN
  -- Cek apakah sudah ada di publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

COMMENT ON COLUMN orders.payment_status IS 'Status pembayaran: BELUM_BAYAR atau SUDAH_BAYAR';
COMMENT ON COLUMN orders.payment_method IS 'Metode pembayaran: CASH atau QRIS';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

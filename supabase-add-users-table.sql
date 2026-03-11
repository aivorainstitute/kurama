-- Fix RLS policy untuk users table
-- Disable RLS dulu
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Hapus policy lama
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Enable RLS lagi
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Buat policy yang benar
CREATE POLICY "Enable all operations" ON users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Pastikan tabel bisa diakses
GRANT ALL ON users TO anon, authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO anon, authenticated;

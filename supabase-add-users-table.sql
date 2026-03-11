-- Tabel users untuk sistem role management
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kasir')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin
INSERT INTO users (username, password_hash, name, role, is_active)
VALUES ('admin', 'admin123', 'Administrator', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- Insert default kasir
INSERT INTO users (username, password_hash, name, role, is_active)
VALUES ('kasir', 'kasir123', 'Kasir Default', 'kasir', true)
ON CONFLICT (username) DO NOTHING;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy untuk admin (bisa lihat semua)
CREATE POLICY "Admin full access" ON users
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Policy untuk read own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

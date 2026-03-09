# 🗄️ Panduan Setup Database Clean Zero (Dari NOL)

## 📋 Persiapan

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project kamu: `uidfzbsrbrridgkskokx`
3. Klik menu **"SQL Editor"** di sidebar kiri
4. Klik **"New Query"**

---

## 🚀 Langkah 1: Jalankan SQL Lengkap

1. **Buka file** `supabase-complete-setup.sql` di VS Code
2. **Copy semua isinya** (Ctrl+A, Ctrl+C)
3. **Paste ke SQL Editor** Supabase
4. Klik tombol **"Run"** (▶️)

### Yang akan terjadi:
- ✅ Semua tabel dibuat
- ✅ Data sample dimasukkan
- ✅ Functions dibuat
- ✅ RLS policies aktif
- ✅ Realtime enabled

---

## 🔍 Langkah 2: Verifikasi Setup

Setelah SQL dijalankan, cek di Supabase:

### A. Cek Table Editor
1. Klik **"Table Editor"** di sidebar
2. Harus muncul 4 tabel:
   - `categories` ✅
   - `menu_items` ✅
   - `orders` ✅
   - `order_items` ✅
   - `order_summary` (View) ✅

### B. Cek Data Menu
1. Klik tabel **"menu_items"**
2. Harus ada 6 menu:
   - Matcha Latte
   - Smashed Avo Toast
   - Caffe Latte
   - Iced Americano
   - Truffle Fries
   - Beef Burger

---

## ⚙️ Langkah 3: Cek Environment Variables

Pastikan file `.env.local` kamu sudah benar:

```env
VITE_SUPABASE_URL=https://uidfzbsrbrridgkskokx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (key lengkap)
```

**Cara cek di Supabase:**
1. Klik **"Project Settings"** (gear icon pojok kiri bawah)
2. Klik **"API"**
3. Copy **"Project URL"** → masukkan ke `VITE_SUPABASE_URL`
4. Copy **"anon public"** → masukkan ke `VITE_SUPABASE_ANON_KEY`

---

## 🧪 Langkah 4: Test Integration

### Test 1: Buka Aplikasi Customer
1. Jalankan: `npm run dev`
2. Buka: http://localhost:5173
3. Masukkan nama → Lanjut ke Menu
4. **Harus muncul menu** (Matcha Latte, dll)

### Test 2: Buat Pesanan
1. Tambah item ke cart
2. Klik Checkout
3. **Cek di Supabase:**
   - Buka Table Editor → `orders`
   - Harus ada data pesanan baru!

### Test 3: Cek Dashboard Admin
1. Login ke `/admin/login`
   - Username: `admin`
   - Password: `cleanzero2024`
2. Di Dashboard → **harus muncul pesanan**

---

## ❓ Troubleshooting

### Masalah: "Table tidak muncul"
**Solusi:**
```sql
-- Cek apakah tabel exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Masalah: "Tidak bisa insert data"
**Solusi:**
```sql
-- Cek RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Kalau rowsecurity = true tapi policy belum ada, jalankan lagi bagian RLS di SQL
```

### Masalah: "Menu tidak muncul di aplikasi"
**Cek:**
1. Console browser (F12) → ada error?
2. Network tab → Supabase request berhasil?
3. Cek `.env.local` sudah benar?

---

## 📊 Struktur Database

```
┌─────────────────┐
│   categories    │
├─────────────────┤
│ id (PK)         │
│ name            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  menu_items     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ price           │
│ category_id (FK)│
│ stock           │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     orders      │────▶│  order_items    │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ order_number    │     │ order_id (FK)   │
│ queue_number    │     │ menu_item_id(FK)│
│ customer_name   │     │ name            │
│ status          │     │ quantity        │
│ total_amount    │     │ unit_price      │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  order_summary  │  (VIEW - read only)
├─────────────────┤
│ id              │
│ order_number    │
│ queue_number    │
│ customer_name   │
│ status          │
│ total_amount    │
│ item_count      │  ← hitung otomatis
└─────────────────┘
```

---

## 🎯 Resume Perintah SQL Penting

### Kalau mau reset semua data tapi keep struktur:
```sql
-- Hapus semua data tapi tabel tetap ada
TRUNCATE TABLE order_items, orders, menu_items, categories RESTART IDENTITY CASCADE;

-- Insert ulang data sample
INSERT INTO categories (name) VALUES ('Signatures'), ('Coffee'), ('Minuman'), ('Makanan');
```

### Kalau mau cek orders hari ini:
```sql
SELECT * FROM order_summary 
WHERE DATE(created_at AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
ORDER BY created_at DESC;
```

### Kalau mau ubah status order:
```sql
UPDATE orders SET status = 'SIAP' WHERE id = 1;
```

---

## ✅ Checklist Setup

- [ ] SQL dijalankan tanpa error
- [ ] 4 tabel muncul di Table Editor
- [ ] 6 menu items ada data
- [ ] `.env.local` sudah update
- [ ] Aplikasi customer bisa lihat menu
- [ ] Bisa buat pesanan
- [ ] Pesanan muncul di Supabase
- [ ] Dashboard admin bisa lihat pesanan

**Kalau semua checklist ✅, database sudah siap pakai!**

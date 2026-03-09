# Supabase Connection Troubleshooting

## Error: "Failed to fetch"

### 🔴 Penyebab Umum & Solusi

#### 1. **CORS (Cross-Origin Resource Sharing)**
Browser memblokir request dari `localhost` ke Supabase.

**Solusi:**
- ✅ Pakai Chrome/Chromium (biasanya lebih toleran CORS)
- ✅ Disable extension ad-blocker/CORS blocker sementara
- ✅ Jalankan dengan flag host:
  ```bash
  npm run dev -- --host
  ```
- ✅ Atau set di `vite.config.ts`:
  ```ts
  server: {
    cors: true,
    host: true
  }
  ```

#### 2. **Supabase Project Paused**
Project Supabase yang tidak aktif > 7 hari akan di-pause.

**Solusi:**
- Buka Supabase Dashboard
- Klik project Anda
- Kalau ada tulisan "Project Paused", klik "Restore Project"
- Tunggu ~2 menit, coba lagi

#### 3. **URL/Key Salah**

**Cek di:**
```
Supabase Dashboard → Project Settings → API
```

**Pastikan:**
- URL: `https://[project-ref].supabase.co` (tanpa slash di akhir)
- Anon Key: dimulai dengan `eyJhbGciOiJIUzI1NiIs...`

#### 4. **RLS (Row Level Security) Memblokir**

**Solusi Cepat (Development Only):**
```sql
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

#### 5. **Firewall/Network**
Koneksi ke Supabase diblokir firewall.

**Solusi:**
- Coba pakai koneksi lain (mobile hotspot)
- Disable VPN jika aktif
- Cek Windows Firewall

---

## 🧪 Test Manual di Browser

Buka browser console (F12 → Console), paste:

```javascript
// Test 1: Cek env vars
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0,20));

// Test 2: Direct fetch
fetch('https://uidfzbsrbrridgkskokx.supabase.co/rest/v1/menu_items?limit=1', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGZ6YnNyYnJyaWRna3Nrb2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzAyMzYsImV4cCI6MjA4NjU0NjIzNn0.VXU8-GIZVkeiNRlGAjulH_2ThaJKdgUhY2zfwA5puhE',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGZ6YnNyYnJyaWRna3Nrb2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzAyMzYsImV4cCI6MjA4NjU0NjIzNn0.VXU8-GIZVkeiNRlGAjulH_2ThaJKdgUhY2zfwA5puhE'
  }
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e));
```

Kalau masih error, lihat error message di console.

---

## ✅ Checklist Setup

- [ ] File `.env` ada di root project
- [ ] `VITE_SUPABASE_URL` benar (copy dari dashboard)
- [ ] `VITE_SUPABASE_ANON_KEY` benar (copy dari dashboard)
- [ ] Server Vite di-restart setelah edit `.env`
- [ ] Tabel `menu_items` sudah dibuat di Supabase
- [ ] RLS di-disable atau policy sudah dibuat
- [ ] Project Supabase tidak paused
- [ ] Koneksi internet aktif
- [ ] Browser tidak punya CORS blocker aktif

---

## 🆘 Masih Error?

Coba pakai **Supabase Local** (self-hosted):

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Lalu ubah .env ke:
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbG... (dari output supabase start)
```

---

## 📞 Dukungan

Kalau semua sudah dicoba tapi masih error:
1. Screenshot error di browser console (F12 → Console)
2. Screenshot Network tab (F12 → Network)
3. Kirim ke saya untuk analisis lebih lanjut

# 🔍 CARA DEBUG KENAPA USER VALID TIDAK BISA LOGIN

## 📋 LANGKAH DEBUG (LAKUKAN INI!)

### STEP 1: Buka Debug Tool

**Di folder project Anda, buka file ini di browser:**
```
C:\Users\leoan\Desktop\wms-system-main\debug-login.html
```

**Atau drag & drop file `debug-login.html` ke browser.**

### STEP 2: Isi Form Test

1. **API URL:** Biarkan default (sudah terisi)
   ```
   https://wms-system-production-6dbe.up.railway.app
   ```

2. **Email:** Masukkan email user yang ADA di database Supabase
   ```
   Contoh: admin@wms.com
   ```

3. **Password:** Masukkan password YANG BENAR untuk user tersebut

### STEP 3: Klik "Test Login"

Tool ini akan otomatis:
- ✅ Test API bisa diakses atau tidak
- ✅ Kirim login request
- ✅ Tampilkan response dari server
- ✅ Cek apakah token ada
- ✅ Simpan ke localStorage
- ✅ Tampilkan debug log lengkap

### STEP 4: Lihat Hasilnya

Ada 3 kemungkinan hasil:

---

## 🔴 KEMUNGKINAN #1: "API TIDAK dapat diakses"

**Penyebab:** Server Railway down atau URL salah

**Solusi:**
1. Buka Railway Dashboard: https://railway.app
2. Cek apakah project sedang running
3. Cek logs untuk error
4. Mungkin perlu redeploy manual

---

## 🟡 KEMUNGKINAN #2: "Status code 401 - Email/password salah"

**Penyebab:** 
- Email/password yang Anda masukkan salah
- User tidak ada di database
- Password sudah di-hash tapi Anda masukkan plain text

**Solusi:**
1. Cek di Supabase Dashboard → Table Editor → Users
2. Pastikan email yang Anda masukkan ADA di sana
3. Pastikan password yang benar (yang waktu register digunakan)

**Jika user ADA tapi masih 401:**
→ Backend Railway BELUM ter-update dengan code baru
→ Perlu force redeploy di Railway

---

## 🟢 KEMUNGKINAN #3: "Status 200 + Token diterima"

**Artinya:** Login BERHASIL di backend!

**Tapi kalau tetap tidak bisa masuk dashboard:**
→ Masalah di frontend (React app belum ter-update)
→ Browser cache masih pakai versi lama

**Solusi:**
1. Hard refresh: `Ctrl + Shift + R`
2. Clear localStorage: `localStorage.clear()`
3. Test lagi

---

## 📸 SCREENSHOT YANG DIBUTUHKAN

Kalau masih tidak bisa setelah debug, kirimkan screenshot ini:

1. **Debug Tool Result** (dari debug-login.html)
   - Semua debug log
   - Checklist results
   - LocalStorage status

2. **Supabase Users Table**
   - Buka https://supabase.com
   - Dashboard → Table Editor → Users
   - Screenshot ada user yang dicoba login

3. **Railway Deployment Logs**
   - https://railway.app → Project → Deployments
   - Klik deployment terakhir
   - Screenshot logs 20 baris terakhir

---

## 🎯 QUICK FIX: Force Redeploy Railway

Kalau debug menunjukkan "401" padahal user & password benar:

1. Buka https://railway.app
2. Login → Pilih project WMS
3. Tab "Deployments"
4. Klik tombol "Redeploy" (atau "Deploy")
5. Tunggu 3-5 menit
6. Test lagi di debug tool

---

## 💡 TIPS TAMBAHAN

### Cek User di Supabase:
```sql
-- Buka Supabase → SQL Editor
SELECT id, name, email, role, created_at 
FROM "Users" 
ORDER BY created_at DESC;
```

### Reset Password Manual (jika lupa):
```sql
-- Hapus user lama, buat baru dengan password yang Anda tahu
-- ATAU gunakan bcrypt hash online tool untuk generate hash baru
```

### Cek apakah DATABASE_URL benar:
1. Railway Dashboard → Variables
2. Harus ada `DATABASE_URL` dengan format:
   ```
   postgresql://postgres.[project]:[password]@[host]:[port]/postgres
   ```

---

## ✅ EXPECTED FLOW (Yang Seharusnya Terjadi)

```
1. User input email & password ✅
2. Klik "Login Sekarang" ✅
3. Frontend kirim POST ke /api/auth/login ✅
4. Backend cek email di database ✅
5. Backend verify password dengan bcrypt ✅
6. Backend return token jika benar ✅
7. Frontend simpan token ✅
8. Redirect ke dashboard ✅
```

**Jika ada step yang gagal, debug tool akan tunjukkan di step mana!**

---

**SEKARANG: Buka `debug-login.html` dan test!**

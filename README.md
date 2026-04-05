# 📦 Warehouse Management System (WMS)

Sistem Manajemen Inventaris Gudang (Fullstack JavaScript) yang dibangun untuk mengelola data barang jaminan dan stok aset secara efisien. Proyek ini mendemonstrasikan integrasi antara **React.js** sebagai Frontend dan *Node.js/Express** sebagai Backend dengan database **PostgreSQL**.

---

## 🚀 Fitur Utama
* Secure Authentication: Login menggunakan JSON Web Token (JWT) dengan enkripsi password menggunakan Bcrypt.
* Inventory Management: Manajemen data barang (CRUD) lengkap dengan fitur upload gambar.
* Database Synchronization: Menggunakan ORM Sequelize untuk sinkronisasi skema database PostgreSQL secara otomatis.
* Modern UI: Interface responsif dengan Bootstrap 5 dan animasi halus dari Framer Motion.

---

## 🛠️ Tech Stack

### Frontend
* React.js (Functional Components & Hooks)
* React Router Dom** (Sistem Routing & Protected Routes)
* Axios (Komunikasi API)
* Bootstrap 5 & Framer Motion** (Styling & Animasi)

### Backend
* Node.js & Express.js**
* PostgreSQL (Database)
* Sequelize (ORM)
* Multer (File Upload)
* JWT & Bcrypt (Security)

---
### Catatam :
* folder warehouse tidak bisa digunakan untuk frontend menggunakan folder warehouse-frontend, untuk backend menggunakan folder backend
* Lihat simulasi aplikasi WMS secara langsung tanpa instalasi:

 [ Berikut adalah link CV, Portofolio, dan Video Demo Aplikasi](https://drive.google.com/drive/folders/1rfJO0OnRNZDOiNbJgl-gxpGZ6lJrUu9o)
 
 [Akses aplikasi di sini](wms-system-production-f450.up.railway.app)

*Video mencakup: Proses Login, Dashboard Ringkasan, dan Manajemen Stok Barang.*

## 📂 Struktur Project
```text
WMS-SYSTEM/
├── backend/            # Express Server, API Routes, & Controllers
├── warehouse/          # React Frontend Application
└── README.md           # Dokumentasi Proyek

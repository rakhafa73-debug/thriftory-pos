# THRIFTORY POS — Full-Stack Retail Management System

Sistem Manajemen POS (Point of Sale) dan Inventaris ritel modern untuk toko pakaian, thrift shop, vintage archive, dan streetwear distro.

Aplikasi ini mencakup:
- **Admin Dashboard**: Analytics omzet, laporan laba rugi, HPP/COGS, valuasi persediaan, dan manajemen RBAC.
- **Kasir POS**: Antarmuka penjualan kasir cepat dengan pencarian SKU/barcode, kamera pemindai, keranjang belanja, perhitungan kembalian, dan cetak struk thermal 58mm/80mm.
- **Offline-First & Outbox Sync Engine**: Transaksi tetap dapat dibuat saat internet offline dengan kunci idempotensi unik (`idemp_*`), disimpan di antrean outbox, dan otomatis tersinkronisasi saat kembali online tanpa duplikasi data.
- **Mobile POS Simulator**: Tampilan dan pengalaman navigasi sentuh ala aplikasi mobile native (Expo / React Native).
- **Katalog Fashion Fleksibel**: Dukungan produk thrift 1-of-1 (stok 1 unit dengan condition grade: Mint, Grade A, Grade B, Vintage Fade) serta pakaian distro multi-ukuran (XS hingga XXL).
- **Manajemen Rantai Pasok**: Pembelian PO dari supplier yang menambah stok secara atomik saat barang diterima (*received*).
- **Stok Opname**: Perhitungan fisik vs sistem dengan kalkulasi deviasi unit dan nilai selisih (*variance value*).
- **Generator Barcode Label**: Pembuat stiker hangtag pakaian dengan barcode SVG vector siap cetak.
- **Database & RLS**: Skema migrasi PostgreSQL / Supabase lengkap dengan Row Level Security policies di `/supabase/migrations/20261012_init_thriftory.sql`.

---

## 🚀 Panduan Menghubungkan ke GitHub

Repositori git lokal telah diinisialisasi dan di-*commit*. Untuk mengunggah ke akun GitHub Anda:

### 1. Buat Repositori Baru di GitHub
1. Buka [GitHub New Repository](https://github.com/new).
2. Beri nama repositori, contoh: `thriftory-pos`.
3. Pilih **Public** atau **Private** sesuai keinginan.
4. Jangan centang "Initialize this repository with a README" (karena file proyek sudah lengkap).
5. Klik **Create repository**.

### 2. Hubungkan Remote & Push ke GitHub

Jalankan perintah berikut di terminal Anda:

```bash
# Tambahkan remote repository GitHub Anda (ganti USERNAME dengan username GitHub Anda)
git remote add origin https://github.com/USERNAME/thriftory-pos.git

# Pastikan branch utama bernama main
git branch -M main

# Unggah seluruh kode ke GitHub
git push -u origin main
```

> **Catatan Autentikasi GitHub:**  
> Jika diminta password, gunakan **GitHub Personal Access Token (PAT)** dengan izin `repo` (dapat dibuat di GitHub: *Settings > Developer settings > Personal access tokens > Tokens (classic)*).

---

## 🛠️ Stack Teknologi

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion
- **Design System**: Warm Cream (`#FDFBF7`), Navy Slate (`#223240`), Vintage Gold (`#E1A23D`)
- **Database**: PostgreSQL 15+ / Supabase (Migrations & RLS)
- **Offline Engine**: IndexedDB / LocalStorage, Outbox Pattern, Idempotency Keys
- **Mata Uang & Format**: Rupiah (IDR `Rp 125.000`), Asia/Jakarta (WIB), format tanggal `DD/MM/YYYY`

---

## 💻 Menjalankan Secara Lokal

```bash
# Install dependensi
npm install

# Jalankan development server
npm run dev
```

Aplikasi dapat diakses di `http://localhost:3000`.

---

## 📁 Struktur Proyek

```
├── index.html
├── package.json
├── README.md
├── metadata.json
├── tsconfig.json
├── vite.config.ts
├── supabase/
│   └── migrations/
│       └── 20261012_init_thriftory.sql   # Skema DB, RLS, Indexes, Stored Procedures
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── assets/
    │   └── images/                       # Foto produk fashion studio
    ├── types/
    │   └── index.ts                      # TypeScript domain models
    ├── utils/
    │   ├── formatters.ts                 # Rupiah & tanggal formatters
    │   └── barcode.ts                    # Generator vector SVG barcode
    ├── services/
    │   └── storage.ts                    # Offline-first storage & atomic sales engine
    └── components/
        ├── common/
        │   ├── Header.tsx                # Role switcher, offline simulator, sync outbox
        │   ├── Sidebar.tsx               # Navigasi 21 menu RBAC
        │   ├── ReceiptModal.tsx          # Struk thermal 58mm & 80mm
        │   └── BarcodeScannerModal.tsx   # Camera barcode scanner
        ├── pos/
        │   ├── POSInterface.tsx          # Desktop POS interface
        │   └── MobilePOSView.tsx         # Mobile touch app preview
        └── admin/
            ├── AdminDashboard.tsx        # KPI metrics & 7-day trend chart
            ├── ProductManagement.tsx     # Katalog pakaian & varian
            ├── InventoryManagement.tsx   # Mutasi & saldo stok
            ├── StockOpname.tsx           # Opname fisik & rekonsiliasi
            ├── PurchaseManagement.tsx    # Supplier & PO
            ├── CustomerManagement.tsx    # Pelanggan & member
            ├── EmployeeManagement.tsx    # Hak akses karyawan (RBAC)
            ├── TransactionHistory.tsx    # Invoice, cetak ulang, refund
            ├── ReportsManagement.tsx     # Laba rugi, COGS, valuasi aset
            ├── BarcodePrintView.tsx      # Cetak label hangtag
            ├── CategoryBrandManagement.tsx
            ├── StoreSettings.tsx         # Pengaturan cabang & struk
            ├── SyncStatusManagement.tsx  # Outbox queue & idempotency
            └── AuditLogView.tsx          # Audit trail operasional
```

---

## 🔒 Hak Akses (Role-Based Access Control)

- **Owner / Super Admin**: Akses seluruh toko & cabang, pengaturan sensitif, laporan keuangan lengkap.
- **Admin Toko**: Mengelola stok produk, varian, pembelian PO, supplier, dan inventaris.
- **Kasir**: Mengoperasikan POS, memindai barcode, mencetak struk. Harga modal (HPP) **secara ketat disembunyikan** dari kasir dan kasir tidak dapat mengubah harga jual atau role pengguna.

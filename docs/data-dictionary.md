# Kamus Data DapurKampus

Prototipe untuk materi workshop. Semua data fiktif. Sumber: `drizzle/migrations/0000_migration.sql` dan `0001_migration.sql`.

## Tabel `menus`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Kunci utama |
| name | text | Nama menu |
| description | text | Deskripsi singkat, default kosong |
| price | integer | Harga satuan dalam rupiah, >= 0 |
| stock | integer | Stok tersedia, >= 0, default 0 |
| image_url | text | Alamat gambar menu (boleh kosong) |
| is_active | boolean | Menu tampil dan bisa dipesan bila true, default true |
| created_at | timestamptz | Waktu dibuat |

Akses: anon dan authenticated boleh membaca menu aktif; admin juga melihat menu tidak aktif.

## Tabel `orders`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Kunci utama |
| order_code | text | Kode order berformat `DK-1234`, unik |
| customer_name | text | Nama pelanggan (fiktif) |
| whatsapp | text | Nomor WhatsApp (fiktif) |
| menu_id | uuid | Kunci tamu ke `menus.id` |
| menu_name | text | Salinan nama menu saat dipesan (snapshot) |
| quantity | integer | Jumlah, > 0 |
| unit_price | integer | Harga satuan saat dipesan |
| promo_code | text | Kode promo yang diisi (boleh kosong) |
| subtotal | integer | unit_price x quantity |
| discount | integer | Potongan harga, default 0 |
| total_price | integer | subtotal - discount |
| pickup_time | timestamptz | Waktu pengambilan |
| status | text | `Baru` (default), `Dikonfirmasi`, `Diproses`, `Siap Diambil`, `Selesai`, `Dibatalkan` |
| notes | text | Catatan pelanggan (boleh kosong) |
| created_at | timestamptz | Waktu pesanan dibuat |

Akses: hanya admin yang boleh membaca dan mengubah `orders` lewat klien Supabase. Pengunjung anonim tidak punya akses langsung; order dibuat dan dicek lewat server function. Perubahan `status` melewati trigger `orders_status_flow` yang hanya mengizinkan maju satu langkah atau pembatalan.

## Tabel `user_roles`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid | Kunci utama |
| user_id | uuid | Kunci tamu ke `auth.users(id)`, ikut terhapus bila pengguna dihapus |
| role | app_role | Enum `admin` atau `user` |

Pasangan `user_id` dan `role` unik. Pengguna yang login hanya dapat membaca barisnya sendiri.

## Fungsi dan trigger

| Nama | Keterangan |
|---|---|
| `has_role(_user_id, _role)` | Mengembalikan true bila pengguna punya peran tersebut; dipakai kebijakan RLS dan halaman admin |
| `handle_first_admin()` dan trigger `on_auth_user_created_admin` | Setelah pengguna baru terdaftar, jika belum ada admin, pengguna itu diberi peran `admin` |
| `enforce_order_status_flow()` dan trigger `orders_status_flow` | Sebelum `UPDATE` pada `orders`, menolak perubahan status yang tidak sesuai alur |

## Data awal

Migrasi mengisi lima menu fiktif dengan harga Rp10.000 sampai Rp25.000.

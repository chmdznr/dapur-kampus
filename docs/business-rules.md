# Aturan Bisnis DapurKampus

> Prototipe untuk materi workshop. Semua data dalam aplikasi ini fiktif.

Semua perhitungan harga ada di `src/lib/pricing.ts`. Halaman form dan server function sama-sama memanggil fungsi di file itu.

## Aturan pemesanan

- Satu pesanan berisi satu menu dengan jumlah 1 sampai 50.
- Menu harus aktif dan stoknya cukup. Jumlah tidak boleh melebihi stok.
- Waktu ambil harus di masa depan.
- Nomor WhatsApp harus berformat nomor seluler Indonesia (lihat catatan di bawah).
- Pembayaran dilakukan di tempat saat pengambilan. Aplikasi tidak memproses pembayaran.
- Pelanggan tidak perlu login. Setiap pesanan mendapat kode order berformat `DK-1234` (empat digit acak) untuk mengecek status.

Catatan format WhatsApp: pola yang dipakai server adalah `^(\+62|62|0)8[0-9]{7,12}$`, yaitu awalan `+62`, `62`, atau `0`, lalu angka `8` dan 7 sampai 12 digit.

## Aturan promo

| Kode | Syarat | Potongan |
|---|---|---|
| `NUSA10` | Subtotal >= Rp50.000 | 10% dari subtotal, dibulatkan |

- Kode dibandingkan persis dengan `NUSA10`: huruf kecil dan spasi di depan atau belakang membuat kode tidak berlaku.
- Hanya ada satu kolom kode promo, jadi kode tidak bisa ditumpuk.

Contoh perhitungan (sama dengan kasus di `src/lib/pricing.test.ts`):

| Harga | Jumlah | Kode | Subtotal | Diskon | Total |
|---|---|---|---|---|---|
| 25.000 | 1 | (kosong) | 25.000 | 0 | 25.000 |
| 25.000 | 2 | `SALAH` | 50.000 | 0 | 50.000 |
| 20.000 | 2 | `NUSA10` | 40.000 | 0 | 40.000 (subtotal di bawah 50.000) |
| 25.000 | 2 | `NUSA10` | 50.000 | 5.000 | 45.000 |
| 30.000 | 2 | `NUSA10` | 60.000 | 6.000 | 54.000 |
| 33.333 | 2 | `NUSA10` | 66.666 | 6.667 | 59.999 |
| 25.000 | 2 | `nusa10` | 50.000 | 0 | 50.000 (huruf kecil tidak berlaku) |

## Pembulatan dan validasi

Semua nilai berupa rupiah bulat. Diskon dihitung dengan `Math.round(subtotal * 0.1)`; contoh 66.666 x 0,1 = 6.666,6 menjadi 6.667. Harga satuan harus bilangan bulat >= 0 dan jumlah bilangan bulat >= 1; selain itu `pricing.ts` melempar `RangeError`.

## Stok

Saat order dibuat, server membaca stok menu lalu mengurangi stok dengan pengecekan optimistik: pembaruan hanya berhasil jika stok di database masih sama dengan yang dibaca. Jika stok sudah berubah (misalnya dipesan orang lain di saat yang sama), server menolak dengan pesan "Stok baru saja berubah, coba lagi". Jika penyimpanan order gagal setelah stok dikurangi, stok dikembalikan ke nilai yang dibaca tadi. Stok tidak dikembalikan ketika order dibatalkan.

## Siklus status pesanan

`Baru` -> `Dikonfirmasi` -> `Diproses` -> `Siap Diambil` -> `Selesai`

Order dapat menjadi `Dibatalkan` selama statusnya belum `Selesai` atau `Dibatalkan`. Order baru selalu berstatus `Baru`. Hanya admin yang mengubah status.

Aturan ini dijaga di dua tempat:

- UI admin (`src/routes/admin.tsx` dengan `src/lib/order-status.ts`) hanya menampilkan tombol untuk status berikutnya dan tombol Batalkan bila diizinkan.
- Trigger database `orders_status_flow` (`drizzle/migrations/0001_migration.sql`) menolak setiap perubahan status yang bukan maju satu langkah atau pembatalan dari status selain `Selesai` dan `Dibatalkan`. Perubahan yang ditolak menghasilkan error `Perubahan status tidak valid`.

## Hak akses

- Pengunjung anonim tidak punya akses langsung ke tabel `orders`. Membuat order dan mengecek status lewat server function di `src/lib/orders.functions.ts`.
- Pengunjung anonim hanya dapat membaca menu aktif.
- Admin ditentukan oleh tabel `user_roles` dan fungsi `has_role`. Akun pertama yang mendaftar otomatis mendapat peran `admin` lewat trigger `on_auth_user_created_admin`.
- Admin membaca dan mengubah `orders` lewat kebijakan RLS (row level security).

## Batas prototipe

- Harga dan total dihitung ulang di server dari harga menu di database, sehingga total dari browser tidak dipercaya. Batas yang tersisa ada di bawah.
- Kode order hanya empat digit (sekitar 9.000 kemungkinan), sehingga dapat ditebak. Status order, nama menu, jumlah, dan total dapat dilihat oleh siapa pun yang tahu kodenya.
- Tidak ada pembatasan jumlah permintaan dan tidak ada CAPTCHA, jadi pembuatan order dan percobaan menebak kode tidak dibatasi.
- Nomor WhatsApp hanya diperiksa formatnya, tidak diverifikasi.
- Tidak ada pembayaran. Stok tidak dikembalikan saat order dibatalkan.
- Pendaftaran di `/admin` terbuka untuk siapa saja; yang pertama mendaftar menjadi admin. Untuk produksi, pendaftaran ini perlu ditutup setelah admin pertama dibuat.
- Jangan dipakai untuk data nyata.

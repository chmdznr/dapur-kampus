# Prompt awal

Prompt ini dikirim ke Lovable untuk membuat versi pertama DapurKampus. Hasilnya kemudian di-review dan diperbaiki lewat commit-commit berikutnya (lihat riwayat commit).

Isinya sengaja ditulis seperti spesifikasi: aktor, data, aturan bisnis, batas akses, dan letak kode perhitungan harga (`src/lib/pricing.ts`). Aslinya satu paragraf; di bawah ini barisnya dipecah per kalimat supaya mudah dibaca, tanpa mengubah isi.

```text
Buat aplikasi web "DapurKampus" berbahasa Indonesia: pre-order makanan dari UMKM sekitar kampus.
Tampilkan banner kecil "Prototipe — jangan masukkan data pribadi" di setiap halaman.
Pakai database dengan dua tabel: menus (name, description, price integer rupiah, stock, image_url, is_active) dan orders (order_code unik pendek misal DK-4821, customer_name, whatsapp, menu_id, menu_name, quantity, unit_price, promo_code, subtotal, discount, total_price, pickup_time, status, notes, created_at).
Isi 5 menu contoh makanan kampus fiktif (harga 10.000–30.000, salah satunya 25.000).
Halaman pelanggan tanpa login: (1) daftar menu aktif berupa kartu dengan gambar, harga format Rp, dan stok; (2) form pesan satu menu: jumlah, waktu ambil, nama, nomor WhatsApp, kode promo, catatan; tampilkan ringkasan Subtotal, Diskon, Total secara langsung saat input berubah; (3) setelah kirim, tampilkan kode order; (4) halaman cek status order dengan memasukkan kode order.
Status order: Baru, Dikonfirmasi, Diproses, Siap Diambil, Selesai, Dibatalkan; order baru selalu berstatus Baru.
Halaman admin /admin wajib login email-password: daftar order terbaru dengan detail dan tombol untuk mengubah status sesuai urutan, plus tombol Batalkan.
Pengunjung anonim hanya boleh membaca menu, membuat order baru berstatus Baru, dan membaca status order; hanya admin yang boleh mengubah order.
PENTING: semua perhitungan harga taruh di file src/lib/pricing.ts sebagai fungsi murni calculateSubtotal(unitPrice, quantity), calculateDiscount(unitPrice, quantity, promoCode), calculateTotal(unitPrice, quantity, promoCode) dengan aturan: kode promo NUSA10 (persis, huruf besar) memberi diskon 10% dibulatkan ke rupiah terdekat jika subtotal minimal Rp50.000; kode lain diskon 0.
Komponen UI hanya memanggil fungsi-fungsi ini.
Desain bersih, ramah ponsel, warna hangat.
```

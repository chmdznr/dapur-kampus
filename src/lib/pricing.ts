// Semua perhitungan harga DapurKampus. Fungsi murni — UI dan server hanya memanggil ini.

export const PROMO_CODE = "NUSA10";
export const PROMO_RATE = 0.1;
export const PROMO_MIN_SUBTOTAL = 50000;

export function calculateSubtotal(unitPrice: number, quantity: number): number {
  if (!Number.isInteger(unitPrice) || unitPrice < 0) {
    throw new RangeError("Harga harus bilangan bulat >= 0");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError("Jumlah harus bilangan bulat >= 1");
  }
  return unitPrice * quantity;
}

export function calculateDiscount(unitPrice: number, quantity: number, promoCode: string | null | undefined): number {
  const subtotal = calculateSubtotal(unitPrice, quantity);
  if (promoCode !== PROMO_CODE) return 0;
  if (subtotal < PROMO_MIN_SUBTOTAL) return 0;
  return Math.round(subtotal * PROMO_RATE);
}

export function calculateTotal(unitPrice: number, quantity: number, promoCode: string | null | undefined): number {
  return calculateSubtotal(unitPrice, quantity) - calculateDiscount(unitPrice, quantity, promoCode);
}

export function formatRupiah(value: number): string {
  return "Rp" + value.toLocaleString("id-ID");
}

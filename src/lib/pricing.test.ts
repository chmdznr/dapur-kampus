import { describe, expect, it } from "vitest";
import { calculateDiscount, calculateSubtotal, calculateTotal } from "./pricing";

describe("pricing", () => {
  it("subtotal = harga x jumlah", () => {
    expect(calculateSubtotal(25000, 2)).toBe(50000);
  });
  it("NUSA10 memberi diskon 10% bila subtotal minimal Rp50.000", () => {
    expect(calculateDiscount(25000, 2, "NUSA10")).toBe(5000);
    expect(calculateTotal(25000, 2, "NUSA10")).toBe(45000);
  });
  it("NUSA10 tidak berlaku bila subtotal di bawah Rp50.000", () => {
    expect(calculateDiscount(25000, 1, "NUSA10")).toBe(0);
    expect(calculateDiscount(49999, 1, "NUSA10")).toBe(0);
  });
  it("kode harus persis huruf besar", () => {
    expect(calculateDiscount(25000, 4, "nusa10")).toBe(0);
    expect(calculateDiscount(25000, 4, " NUSA10")).toBe(0);
  });
  it("kode lain diskon 0", () => {
    expect(calculateDiscount(25000, 4, "PROMO")).toBe(0);
  });
  it("diskon dibulatkan ke rupiah terdekat", () => {
    expect(calculateDiscount(10005, 5, "NUSA10")).toBe(5003); // 5002.5 -> 5003
    expect(calculateDiscount(10001, 5, "NUSA10")).toBe(5001); // 5000.5 -> 5001
  });
});

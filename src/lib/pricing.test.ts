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

describe("tabel kasus promo", () => {
  it.each([
    // harga, jumlah, kode, subtotal, diskon, total
    [25000, 1, "", 25000, 0, 25000],
    [25000, 2, "SALAH", 50000, 0, 50000],
    [20000, 2, "NUSA10", 40000, 0, 40000],
    [25000, 2, "NUSA10", 50000, 5000, 45000],
    [30000, 2, "NUSA10", 60000, 6000, 54000],
    [33333, 2, "NUSA10", 66666, 6667, 59999],
  ])("%i x %i dengan kode '%s'", (harga, jumlah, kode, subtotal, diskon, total) => {
    expect(calculateSubtotal(harga, jumlah)).toBe(subtotal);
    expect(calculateDiscount(harga, jumlah, kode)).toBe(diskon);
    expect(calculateTotal(harga, jumlah, kode)).toBe(total);
  });
});

describe("input tidak valid ditolak", () => {
  it("harga negatif", () => {
    expect(() => calculateSubtotal(-1, 1)).toThrow(RangeError);
    expect(() => calculateTotal(-1, 2, "NUSA10")).toThrow(RangeError);
  });
  it("jumlah nol, negatif, atau pecahan", () => {
    expect(() => calculateSubtotal(25000, 0)).toThrow(RangeError);
    expect(() => calculateDiscount(25000, -1, "NUSA10")).toThrow(RangeError);
    expect(() => calculateSubtotal(25000, 1.5)).toThrow(RangeError);
  });
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { calculateDiscount, calculateSubtotal, calculateTotal } from "./pricing";

const orderSchema = z.object({
  menuId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  pickupTime: z.string().datetime({ offset: true }),
  customerName: z.string().trim().min(1, "Nama wajib diisi").max(80),
  whatsapp: z.string().trim().regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor WhatsApp tidak valid"),
  promoCode: z.string().max(30).optional().default(""),
  notes: z.string().trim().max(300).optional().default(""),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    if (new Date(data.pickupTime).getTime() < Date.now()) {
      throw new Error("Waktu ambil harus di masa depan");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: menu, error } = await supabaseAdmin
      .from("menus")
      .select("id, name, price, stock, is_active")
      .eq("id", data.menuId)
      .maybeSingle();
    if (error) throw new Error("Gagal memuat menu");
    if (!menu || !menu.is_active) throw new Error("Menu tidak tersedia");
    if (menu.stock < data.quantity) throw new Error(`Stok tersisa ${menu.stock}`);

    const { data: updated } = await supabaseAdmin
      .from("menus")
      .update({ stock: menu.stock - data.quantity })
      .eq("id", menu.id)
      .eq("stock", menu.stock)
      .select("id");
    if (!updated || updated.length === 0) throw new Error("Stok baru saja berubah, coba lagi");

    const promo = data.promoCode || null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = "DK-" + String(Math.floor(1000 + Math.random() * 9000));
      const { error: insErr } = await supabaseAdmin.from("orders").insert({
        order_code: code,
        customer_name: data.customerName,
        whatsapp: data.whatsapp,
        menu_id: menu.id,
        menu_name: menu.name,
        quantity: data.quantity,
        unit_price: menu.price,
        promo_code: promo,
        subtotal: calculateSubtotal(menu.price, data.quantity),
        discount: calculateDiscount(menu.price, data.quantity, promo),
        total_price: calculateTotal(menu.price, data.quantity, promo),
        pickup_time: data.pickupTime,
        status: "Baru",
        notes: data.notes || null,
      });
      if (!insErr) return { orderCode: code };
      if (insErr.code !== "23505") break;
    }
    await supabaseAdmin.from("menus").update({ stock: menu.stock }).eq("id", menu.id);
    throw new Error("Gagal membuat order, coba lagi");
  });

export const getOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().toUpperCase().regex(/^DK-\d{4}$/, "Format kode: DK-1234") }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_code, menu_name, quantity, total_price, pickup_time, status, created_at")
      .eq("order_code", data.code)
      .maybeSingle();
    return order ?? null;
  });

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateDiscount, calculateSubtotal, calculateTotal, formatRupiah } from "@/lib/pricing";
import { createOrder } from "@/lib/orders.functions";
import { createCheckoutForOrder } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const menuQuery = (id: string) =>
  queryOptions({
    queryKey: ["menu", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menus")
        .select("id, name, description, price, stock, image_url")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/pesan/$menuId")({
  head: () => ({
    meta: [
      { title: "Pesan Menu — DapurKampus" },
      { name: "description", content: "Isi jumlah, waktu ambil, dan kontak untuk pre-order menu ini." },
      { property: "og:title", content: "Pesan Menu — DapurKampus" },
      { property: "og:description", content: "Pre-order makanan UMKM kampus." },
    ],
  }),
  loader: async ({ context, params }) => {
    const menu = await context.queryClient.ensureQueryData(menuQuery(params.menuId));
    if (!menu) throw notFound();
  },
  component: OrderPage,
});

function defaultPickup() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function OrderPage() {
  const { menuId } = Route.useParams();
  const { data: menu } = useSuspenseQuery(menuQuery(menuId));
  const qc = useQueryClient();
  const submit = useServerFn(createOrder);
  const [quantity, setQuantity] = useState(1);
  const [pickup, setPickup] = useState(defaultPickup);
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [promo, setPromo] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  if (!menu) return null;
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  // Selama kolom jumlah kosong, ringkasan harga tampil nol.
  const subtotal = qty > 0 ? calculateSubtotal(menu.price, qty) : 0;
  const discount = qty > 0 ? calculateDiscount(menu.price, qty, promo) : 0;
  const total = qty > 0 ? calculateTotal(menu.price, qty, promo) : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (qty < 1 || qty > menu!.stock) {
      toast.error(`Jumlah harus 1–${menu!.stock}`);
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          menuId,
          quantity: qty,
          pickupTime: new Date(pickup).toISOString(),
          customerName: name,
          whatsapp: wa.replace(/[\s-]/g, ""),
          promoCode: promo,
          notes,
        },
      });
      setOrderCode(res.orderCode);
      qc.invalidateQueries();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim order";
      toast.error(msg.startsWith("[") ? "Periksa kembali isian form" : msg);
    } finally {
      setBusy(false);
    }
  }

  async function payOnline() {
    if (!orderCode) return;
    // Buka tab dulu agar tidak diblokir browser, lalu arahkan ke halaman bayar.
    const win = window.open("", "_blank");
    setPaying(true);
    try {
      const url = await createCheckoutForOrder({ menuName: menu!.name, quantity: qty, promoCode: promo, orderCode });
      if (win) win.location.href = url;
      else window.open(url, "_blank");
    } catch (err) {
      win?.close();
      toast.error(err instanceof Error ? err.message : "Gagal membuka pembayaran");
    } finally {
      setPaying(false);
    }
  }

  if (orderCode) {
    return (
      <div className="max-w-md mx-auto text-center rounded-3xl bg-card border shadow-card p-8">
        <CheckCircle2 className="size-12 mx-auto text-success" />
        <h1 className="text-2xl font-extrabold mt-3">Order terkirim!</h1>
        <p className="text-muted-foreground mt-1">Simpan kode order ini untuk cek status:</p>
        <div className="font-display text-4xl font-extrabold text-primary tracking-wider my-5">{orderCode}</div>
        <div className="flex flex-col gap-2">
          <Button onClick={payOnline} disabled={paying} size="lg" className="rounded-full">
            {paying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            Bayar online sekarang ({formatRupiah(total)})
          </Button>
          <p className="text-xs text-muted-foreground">Atau bayar di tempat saat mengambil pesanan.</p>
          <Button asChild variant="outline" className="rounded-full"><Link to="/cek-status" search={{ kode: orderCode }}>Cek status order</Link></Button>
          <Button asChild variant="ghost"><Link to="/">Kembali ke menu</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
      <div className="rounded-2xl overflow-hidden border bg-card shadow-card h-fit">
        {menu.image_url && <img src={menu.image_url} alt={menu.name} width={944} height={704} className="aspect-[4/3] w-full object-cover" />}
        <div className="p-4">
          <h1 className="text-2xl font-extrabold">{menu.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{menu.description}</p>
          <div className="mt-3 text-xl font-extrabold text-primary">{formatRupiah(menu.price)}</div>
          <div className="text-xs text-muted-foreground">Stok: {menu.stock}</div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border bg-card shadow-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="qty">Jumlah</Label>
            <Input id="qty" type="number" min={1} max={menu.stock} value={quantity || ""} onChange={(e) => setQuantity(parseInt(e.target.value, 10))} required />
          </div>
          <div>
            <Label htmlFor="pickup">Waktu ambil</Label>
            <Input id="pickup" type="datetime-local" value={pickup} onChange={(e) => setPickup(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label htmlFor="name">Nama</Label>
          <Input id="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="wa">Nomor WhatsApp</Label>
          <Input id="wa" type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" value={wa} onChange={(e) => setWa(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="promo">Kode promo</Label>
          <Input id="promo" value={promo} maxLength={30} onChange={(e) => setPromo(e.target.value)} placeholder="opsional" />
        </div>
        <div>
          <Label htmlFor="notes">Catatan</Label>
          <Textarea id="notes" value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} placeholder="mis. sambal dipisah" />
        </div>

        <dl className="rounded-xl bg-secondary p-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatRupiah(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Diskon</dt><dd className={discount ? "text-success font-semibold" : ""}>−{formatRupiah(discount)}</dd></div>
          <div className="flex justify-between text-base font-extrabold pt-1 border-t border-border"><dt>Total</dt><dd className="text-primary">{formatRupiah(total)}</dd></div>
        </dl>

        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>
          {busy ? "Mengirim…" : "Kirim pesanan"}
        </Button>
      </form>
    </div>
  );
}

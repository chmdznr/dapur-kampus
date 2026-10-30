import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/pricing";
import { canCancel, nextStatus, CANCELLED } from "@/lib/order-status";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — DapurKampus" },
      { name: "description", content: "Kelola pesanan DapurKampus." },
      { property: "og:title", content: "Admin — DapurKampus" },
      { property: "og:description", content: "Panel admin DapurKampus." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <p className="text-muted-foreground">Memuat…</p>;
  if (!session) return <LoginForm />;
  return <AdminOrders userId={session.user.id} email={session.user.email ?? ""} />;
}

// Pendaftaran sengaja tidak disediakan: akun admin sudah dibuat sebelum aplikasi dipublikasikan.
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error("Email atau kata sandi salah");
    setBusy(false);
  }

  return (
    <div className="max-w-sm mx-auto rounded-2xl border bg-card shadow-card p-6">
      <h1 className="text-2xl font-extrabold mb-4">Masuk admin</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><Label htmlFor="pw">Kata sandi</Label><Input id="pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" className="w-full rounded-full" disabled={busy}>Masuk</Button>
      </form>
    </div>
  );
}

function AdminOrders({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const role = useQuery({
    queryKey: ["is-admin", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      return !!data;
    },
  });
  const orders = useQuery({
    queryKey: ["admin-orders"],
    enabled: role.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("Gagal mengubah status");
    else {
      toast.success(`Status: ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  }

  async function signOut() {
    qc.clear();
    await supabase.auth.signOut();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-2xl font-extrabold">Order terbaru</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">{email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>Keluar</Button>
        </div>
      </div>
      {role.isLoading && <p className="text-muted-foreground">Memeriksa akses…</p>}
      {role.data === false && <p className="text-destructive">Akun ini bukan admin.</p>}
      {orders.data?.length === 0 && <p className="text-muted-foreground">Belum ada order.</p>}
      <div className="space-y-3">
        {orders.data?.map((o) => {
          const next = nextStatus(o.status);
          return (
            <div key={o.id} className="rounded-2xl border bg-card shadow-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-lg font-extrabold">{o.order_code}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-2">
                <p><b>{o.quantity}× {o.menu_name}</b> @ {formatRupiah(o.unit_price)}</p>
                <p>Ambil: {new Date(o.pickup_time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
                <p>{o.customer_name} · {o.whatsapp}</p>
                <p>Subtotal {formatRupiah(o.subtotal)} − Diskon {formatRupiah(o.discount)}{o.promo_code ? ` (${o.promo_code})` : ""} = <b className="text-primary">{formatRupiah(o.total_price)}</b></p>
                {o.notes && <p className="sm:col-span-2 text-muted-foreground">Catatan: {o.notes}</p>}
                <p className="sm:col-span-2 text-xs text-muted-foreground">Dibuat {new Date(o.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex gap-2 mt-3">
                {next && <Button size="sm" className="rounded-full" onClick={() => setStatus(o.id, next)}>Jadikan “{next}”</Button>}
                {canCancel(o.status) && (
                  <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={() => confirm("Batalkan order ini?") && setStatus(o.id, CANCELLED)}>
                    Batalkan
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

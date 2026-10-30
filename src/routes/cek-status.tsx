import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { getOrderStatus } from "@/lib/orders.functions";
import { formatRupiah } from "@/lib/pricing";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/cek-status")({
  validateSearch: z.object({ kode: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Cek Status Order — DapurKampus" },
      { name: "description", content: "Masukkan kode order DapurKampus untuk melihat status pesananmu." },
      { property: "og:title", content: "Cek Status Order — DapurKampus" },
      { property: "og:description", content: "Lacak pesanan makananmu dengan kode order." },
    ],
  }),
  component: StatusPage,
});

type Result = Awaited<ReturnType<typeof getOrderStatus>>;

function StatusPage() {
  const { kode } = Route.useSearch();
  const fetchStatus = useServerFn(getOrderStatus);
  const [code, setCode] = useState(kode ?? "");
  const [result, setResult] = useState<Result | undefined>(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(c: string) {
    setBusy(true);
    setError("");
    try {
      setResult(await fetchStatus({ data: { code: c } }));
    } catch {
      setResult(undefined);
      setError("Format kode: DK-1234");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (kode) lookup(kode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    lookup(code);
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold mb-4">Cek status order</h1>
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="DK-4821" className="uppercase" required />
        <Button type="submit" disabled={busy} className="rounded-full">{busy ? "…" : "Cek"}</Button>
      </form>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      {result === null && <p className="mt-6 text-muted-foreground">Order tidak ditemukan.</p>}
      {result && (
        <div className="mt-6 rounded-2xl border bg-card shadow-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl font-extrabold">{result.order_code}</span>
            <StatusBadge status={result.status} />
          </div>
          <p>{result.quantity}× {result.menu_name}</p>
          <p className="text-sm text-muted-foreground">Ambil: {new Date(result.pickup_time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p>
          <p className="font-bold text-primary">{formatRupiah(result.total_price)}</p>
        </div>
      )}
    </div>
  );
}

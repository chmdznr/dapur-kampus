import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

export const menusQuery = queryOptions({
  queryKey: ["menus"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("menus")
      .select("id, name, description, price, stock, image_url")
      .eq("is_active", true)
      .order("price");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Menu Hari Ini — DapurKampus" },
      { name: "description", content: "Pilih menu dari UMKM sekitar kampus dan pre-order untuk diambil nanti." },
      { property: "og:title", content: "Menu Hari Ini — DapurKampus" },
      { property: "og:description", content: "Pre-order makanan UMKM kampus, ambil sesuai jadwalmu." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menusQuery),
  component: Index,
});

function Index() {
  const { data: menus } = useSuspenseQuery(menusQuery);
  return (
    <div>
      <section className="rounded-3xl bg-warm text-primary-foreground p-6 sm:p-10 mb-8 shadow-card">
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Lapar sebelum kelas?<br />Pesan dulu, ambil nanti.</h1>
        <p className="mt-2 opacity-90 max-w-md">Masakan rumahan dari UMKM sekitar kampus. Pakai kode <b>NUSA10</b> untuk diskon 10% (min. Rp50.000).</p>
      </section>
      <h2 className="text-xl font-bold mb-4">Menu tersedia</h2>
      {menus.length === 0 && <p className="text-muted-foreground">Belum ada menu aktif.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {menus.map((m) => (
          <article key={m.id} className="rounded-2xl bg-card border overflow-hidden shadow-card flex flex-col">
            {m.image_url && (
              <img src={m.image_url} alt={m.name} loading="lazy" width={944} height={704} className="aspect-[4/3] w-full object-cover" />
            )}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-lg leading-snug">{m.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 flex-1">{m.description}</p>
              <div className="flex items-end justify-between mt-4">
                <div>
                  <div className="text-xl font-extrabold text-primary">{formatRupiah(m.price)}</div>
                  <div className="text-xs text-muted-foreground">Stok: {m.stock}</div>
                </div>
                {m.stock > 0 ? (
                  <Button asChild className="rounded-full">
                    <Link to="/pesan/$menuId" params={{ menuId: m.id }}>Pesan</Link>
                  </Button>
                ) : (
                  <Button disabled className="rounded-full">Habis</Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

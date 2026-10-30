import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { UtensilsCrossed } from "lucide-react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-warning text-warning-foreground text-center text-xs font-semibold py-1.5 px-3">
        Prototipe — jangan masukkan data pribadi
      </div>
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold text-primary">
            <span className="grid place-items-center size-8 rounded-xl bg-warm text-primary-foreground">
              <UtensilsCrossed className="size-4" />
            </span>
            DapurKampus
          </Link>
          <nav className="flex gap-1 text-sm font-semibold">
            <Link to="/" className="px-3 py-1.5 rounded-full hover:bg-secondary" activeOptions={{ exact: true }} activeProps={{ className: "bg-secondary" }}>
              Menu
            </Link>
            <Link to="/cek-status" className="px-3 py-1.5 rounded-full hover:bg-secondary" activeProps={{ className: "bg-secondary" }}>
              Cek Status
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-muted-foreground py-6">
        DapurKampus · UMKM sekitar kampus ·{" "}
        <Link to="/admin" className="underline">Admin</Link>
      </footer>
    </div>
  );
}

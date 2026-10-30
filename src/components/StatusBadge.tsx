import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Baru: "bg-accent text-accent-foreground",
  Dikonfirmasi: "bg-secondary text-secondary-foreground",
  Diproses: "bg-warning text-warning-foreground",
  "Siap Diambil": "bg-primary text-primary-foreground",
  Selesai: "bg-success text-success-foreground",
  Dibatalkan: "bg-destructive text-destructive-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", styles[status] ?? "bg-muted")}>{status}</span>;
}

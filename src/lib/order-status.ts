export const ORDER_FLOW = ["Baru", "Dikonfirmasi", "Diproses", "Siap Diambil", "Selesai"] as const;
export const CANCELLED = "Dibatalkan";
export type OrderStatus = (typeof ORDER_FLOW)[number] | typeof CANCELLED;

export function nextStatus(status: string): OrderStatus | null {
  const i = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
  if (i < 0 || i === ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[i + 1];
}

export function canCancel(status: string): boolean {
  return status !== "Selesai" && status !== CANCELLED;
}

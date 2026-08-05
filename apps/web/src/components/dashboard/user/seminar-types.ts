export type DashboardSeminar = {
  id: string;
  title: string;
  description?: string | null;
  dateTime: string;
  image: string | null;
  type: "free" | "paid";
  price: number;
  url: string | null;
  duration: string | null;
  registrations?: number;
  registeredAt?: string;
};

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

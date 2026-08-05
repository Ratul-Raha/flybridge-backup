export const BRAND = "#6E4CFF";
export const AMBER = "#F59E0B";
export const SKY = "#0EA5E9";
export const EMERALD = "#10B981";
export const ROSE = "#F43F5E";

export const AXIS_LABEL = "#A6ADC0";
export const SPLIT_LINE = "#F1F3F8";

export const CARD_TOOLTIP = {
  backgroundColor: "#fff",
  borderColor: "#EEF0F6",
  borderWidth: 1,
  padding: [10, 14],
  textStyle: { color: "#12162A", fontSize: 12.5 },
  extraCssText: "box-shadow:0 12px 30px -12px rgba(18,22,42,0.25);border-radius:12px;",
};

export function timeAgo(value: string | Date) {
  const at = new Date(value).getTime();
  const diff = Date.now() - at;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

export function priceLabel(type: string, price: number) {
  return type === "paid" ? `$${Number(price || 0).toLocaleString()}` : "Free";
}
export type Country = {
  name: string;
  code: string;
  flag: string;
};

export const COUNTRIES: Country[] = [
  { name: "Bangladesh", code: "BD", flag: "🇧🇩" },
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "Austria", code: "AT", flag: "🇦🇹" },
  { name: "Belgium", code: "BE", flag: "🇧🇪" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "China", code: "CN", flag: "🇨🇳" },
  { name: "Croatia", code: "HR", flag: "🇭🇷" },
  { name: "Cyprus", code: "CY", flag: "🇨🇾" },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿" },
  { name: "Denmark", code: "DK", flag: "🇩🇰" },
  { name: "Egypt", code: "EG", flag: "🇪🇬" },
  { name: "Estonia", code: "EE", flag: "🇪🇪" },
  { name: "Finland", code: "FI", flag: "🇫🇮" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Georgia", code: "GE", flag: "🇬🇪" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "Greece", code: "GR", flag: "🇬🇷" },
  { name: "Hungary", code: "HU", flag: "🇭🇺" },
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "Ireland", code: "IE", flag: "🇮🇪" },
  { name: "Italy", code: "IT", flag: "🇮🇹" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "Jordan", code: "JO", flag: "🇯🇴" },
  { name: "Kazakhstan", code: "KZ", flag: "🇰🇿" },
  { name: "Kenya", code: "KE", flag: "🇰🇪" },
  { name: "Latvia", code: "LV", flag: "🇱🇻" },
  { name: "Lithuania", code: "LT", flag: "🇱🇹" },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾" },
  { name: "Malta", code: "MT", flag: "🇲🇹" },
  { name: "Mexico", code: "MX", flag: "🇲🇽" },
  { name: "Nepal", code: "NP", flag: "🇳🇵" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬" },
  { name: "Norway", code: "NO", flag: "🇳🇴" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰" },
  { name: "Philippines", code: "PH", flag: "🇵🇭" },
  { name: "Poland", code: "PL", flag: "🇵🇱" },
  { name: "Portugal", code: "PT", flag: "🇵🇹" },
  { name: "Romania", code: "RO", flag: "🇷🇴" },
  { name: "Russia", code: "RU", flag: "🇷🇺" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  { name: "Serbia", code: "RS", flag: "🇷🇸" },
  { name: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "Slovakia", code: "SK", flag: "🇸🇰" },
  { name: "Slovenia", code: "SI", flag: "🇸🇮" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦" },
  { name: "South Korea", code: "KR", flag: "🇰🇷" },
  { name: "Spain", code: "ES", flag: "🇪🇸" },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰" },
  { name: "Sweden", code: "SE", flag: "🇸🇪" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭" },
  { name: "Thailand", code: "TH", flag: "🇹🇭" },
  { name: "Turkey", code: "TR", flag: "🇹🇷" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳" },
].sort((a, b) => a.name.localeCompare(b.name));

export function countryByCode(code?: string | null): Country | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === upper);
}

export function countryByName(name?: string | null): Country | undefined {
  if (!name) return undefined;
  const lower = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === lower);
}

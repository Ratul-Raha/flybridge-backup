import { permanentRedirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Permanently moves an old landing-page URL to its canonical /programs/[slug]
 * page while preserving campaign query parameters (UTM, ad IDs, etc.).
 */
export function redirectToProgram(slug: string, searchParams?: SearchParams): never {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.append(key, value);
    }
  }

  const suffix = query.toString();
  permanentRedirect(`/programs/${slug}${suffix ? `?${suffix}` : ""}`);
}

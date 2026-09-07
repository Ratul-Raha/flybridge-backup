import "server-only";

import net from "net";
import dns from "dns/promises";

const PRIVATE_HOST_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home.arpa"];

function looksLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "localhost.localdomain") return true;
  if (net.isIP(h)) return false;
  return PRIVATE_HOST_SUFFIXES.some((suffix) => h.endsWith(suffix));
}

function isPrivateAddress(ip: string): boolean {
  const ipv4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;

  if (net.isIPv4(ipv4)) {
    const [a, b, c] = ipv4.split(".").map(Number);
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0) return true;
    if (a >= 224) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    if (lower.startsWith("2001:db8")) return true;
    if (lower.startsWith("ff")) return true;
    return false;
  }

  return true;
}

async function resolveAddresses(hostname: string): Promise<string[]> {
  if (net.isIP(hostname)) return [hostname];
  const result = await dns.lookup(hostname, { all: true });
  return result.map((r) => r.address);
}

function parseUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  return parsed;
}

function assertNoCredentials(parsed: URL): void {
  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not allowed");
  }
}

export async function assertSafeFetchUrl(raw: string): Promise<void> {
  const parsed = parseUrl(raw);
  assertNoCredentials(parsed);
  const hostname = parsed.hostname.toLowerCase();

  if (looksLocalHostname(hostname)) {
    throw new Error("Local hostnames are not allowed");
  }

  let addresses: string[];
  try {
    addresses = await resolveAddresses(hostname);
  } catch {
    throw new Error("Could not resolve host");
  }

  if (addresses.some(isPrivateAddress)) {
    throw new Error("Private IP addresses are not allowed");
  }
}

export function assertSafeRedirectUrl(raw: string): void {
  const parsed = parseUrl(raw);
  assertNoCredentials(parsed);
  const hostname = parsed.hostname.toLowerCase();
  if (looksLocalHostname(hostname)) {
    throw new Error("Local hostnames are not allowed");
  }
}
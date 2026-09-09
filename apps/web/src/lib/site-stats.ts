import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";

export async function getTotalUsers(): Promise<number> {
  try {
    await connectDb();
    const count = await User.countDocuments();
    return count;
  } catch (error) {
    console.error("getTotalUsers error", error);
    return 0;
  }
}

export function formatUsersFull(n: number): string {
  return `${n.toLocaleString()}+`;
}

export function formatUsersCompact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M+`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k+`;
  }
  return `${n}+`;
}
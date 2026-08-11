import { readSession } from "./session";

export async function requireAdmin() {
  const session = await readSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

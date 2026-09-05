import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { BlogManage } from "@/components/dashboard/blog-manage";

export const metadata: Metadata = {
  title: "Blogs | FlyBridge",
};

export default async function BlogsPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  if (session.role === "moderator" || session.role === "admin") {
    return <BlogManage />;
  }

  redirect("/dashboard");
}
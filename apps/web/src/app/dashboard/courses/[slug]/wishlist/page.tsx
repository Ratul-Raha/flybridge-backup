import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { CourseWishlist } from "@/components/dashboard/course-wishlist";

export const metadata: Metadata = {
  title: "Course Wishlist | FlyBridge",
};

export default async function CourseWishlistPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && session.role !== "moderator") {
    redirect("/dashboard");
  }

  return <CourseWishlist courseSlug={params.slug} />;
}
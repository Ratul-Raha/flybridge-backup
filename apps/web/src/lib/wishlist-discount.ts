import "server-only";

import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { CourseWishlist } from "@/lib/models/wishlist";
import { applyWishlistDiscount, type WishlistDiscount } from "@/lib/wishlist";

/**
 * Resolves the wishlist discount for a specific buyer on a course, or returns
 * `null` when the buyer is not on the course's waitlist (or the discount is
 * zero). The match mirrors how the waitlist form stores members: by signed-in
 * user id, and by email as a fallback for buyers who joined before signing in.
 */
export async function resolveWishlistDiscount(input: {
  itemType: string;
  itemId: string;
  userId: string;
  email: string;
  price: number;
}): Promise<WishlistDiscount | null> {
  if (input.itemType !== "course") return null;
  if (!Types.ObjectId.isValid(input.itemId)) return null;

  await connectDb();
  const courseId = new Types.ObjectId(input.itemId);

  const entry = await CourseWishlist.findOne({
    course: courseId,
    $or: [
      ...(input.userId && Types.ObjectId.isValid(input.userId)
        ? [{ user: new Types.ObjectId(input.userId) }]
        : []),
      ...(input.email ? [{ email: input.email.toLowerCase() }] : []),
    ],
  }).lean();

  if (!entry) return null;

  const result = applyWishlistDiscount(input.price, entry.discountPercent ?? 0);
  return result.percent > 0 ? result : null;
}

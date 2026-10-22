import { revalidateTag } from "next/cache";

/**
 * Cache tag for the aggregate user dashboard payload.
 *
 * `unstable_cache` requires its tags at definition time, so the tag is global
 * rather than per user. The cache key still includes the user id, meaning one
 * invalidation only causes the next visit for each user to re-query.
 */
export const USER_DASHBOARD_TAG = "user-dashboard";

export function revalidateUserDashboard(): void {
  revalidateTag(USER_DASHBOARD_TAG);
}

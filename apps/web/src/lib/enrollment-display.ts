/**
 * Static enrollment boosts for public-facing course listings.
 *
 * The real, dynamic enrollment count is still computed from the database
 * (see `CourseEnrollment.aggregate` in the programs pages) and passed in as
 * `real`. For now the displayed total is padded by a fixed amount per course
 * so the number stays stable while real enrollments ramp up.
 *
 * To revert to the raw dynamic count, remove the entry below (or stop calling
 * `displayEnrollmentCount` in the programs pages).
 */
const ENROLLMENT_BOOST: Record<string, number> = {
  "ielts-band-score-machine": 17,
};

export function displayEnrollmentCount(slug: string, real: number): number {
  return real + (ENROLLMENT_BOOST[slug] ?? 0);
}

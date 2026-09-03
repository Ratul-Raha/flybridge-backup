import mongoose from "mongoose";
import { Course } from "./models/course";
import { CourseReview } from "./models/course-review";

export async function recalculateCourseRating(courseId: mongoose.Types.ObjectId | string) {
  const result = await CourseReview.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const avg = result.length > 0 ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length > 0 ? result[0].count : 0;

  await Course.findByIdAndUpdate(courseId, {
    averageRating: avg,
    reviewCount: count,
  });

  return { averageRating: avg, reviewCount: count };
}

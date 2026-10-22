import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { readSession } from "@/lib/auth/session";
import { revalidateUserDashboard } from "@/lib/dashboard/tags";
import { Order } from "@/lib/models/order";
import { User } from "@/lib/models/user";
import { Course } from "@/lib/models/course";
import { CourseEnrollment } from "@/lib/models/enrollment";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await readSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, courseId } = body;

    if (!email || !courseId) {
      return NextResponse.json({ error: "Missing email or courseId" }, { status: 400 });
    }

    await connectDb();

    // Verify order exists
    const order = await Order.findById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find or create user by email
    let user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      user = await User.create({
        name: email.split("@")[0],
        email: email.trim().toLowerCase(),
        accountType: "user",
        subscription: "free",
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Create or update enrollment
    const enrollment = await CourseEnrollment.findOneAndUpdate(
      { user: user._id, course: course._id },
      {
        $setOnInsert: { user: user._id, course: course._id },
        $set: {
          order: order._id,
          status: "active",
          lessonsPlayed: 0,
          lessonsOpened: [],
          mockTestsPlayed: 0,
          refundForfeitedAt: null,
          refundForfeitedReason: null,
        },
      },
      { upsert: true, new: true }
    );
    revalidateUserDashboard();

    return NextResponse.json({
      ok: true,
      enrollment: {
        id: enrollment._id.toString(),
        user: enrollment.user.toString(),
        course: enrollment.course.toString(),
        status: enrollment.status,
      },
      userEmail: user.email,
    });
  } catch (error) {
    console.error("grant access error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

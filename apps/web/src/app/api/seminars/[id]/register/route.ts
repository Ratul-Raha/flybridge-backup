import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { verifyIdToken } from "@/lib/auth/token";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { User } from "@/lib/models/user";
import type { SubscriptionType } from "@/lib/roles";

type RegistrationBody = {
  name?: string;
  phone?: string;
  email?: string;
  idToken?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as RegistrationBody;
    await connectDb();

    const seminar = await Seminar.findById(params.id);
    if (!seminar) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }

    let email = body.email?.toLowerCase().trim() ?? "";
    let name = body.name?.trim() ?? "";
    let phone = body.phone?.trim() ?? "";
    let user = null;

    if (body.idToken) {
      try {
        const claims = await verifyIdToken(body.idToken);
        email = claims.email?.toLowerCase() ?? "";
        if (!email || !claims.email_verified) {
          return NextResponse.json(
            { error: "A verified email is required" },
            { status: 400 }
          );
        }
        name = claims.name?.trim() ?? name;
        phone = claims.phone_number ?? phone;
        user = await User.findOne({ email });
        if (user) {
          if (!user.name && name) user.name = name;
          if (!user.phone && phone) user.phone = phone;
          if (!user.avatar && claims.picture) user.avatar = claims.picture;
          await user.save();
        } else {
          user = await User.create({
            firebaseUid: claims.uid,
            name: name || email.split("@")[0],
            email,
            avatar: claims.picture,
            phone: phone || undefined,
            accountType: "user",
            subscription: "free" as SubscriptionType,
          });
        }
      } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } else {
      if (!email) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }
      user = await User.findOne({ email });
      if (user) {
        if (name && (user.name !== name || (!user.phone && phone))) {
          user.name = name || user.name;
          if (phone) user.phone = phone;
          await user.save();
        }
      } else {
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          phone: phone || undefined,
          accountType: "user",
          subscription: "free" as SubscriptionType,
        });
      }
    }

    const existing = await SeminarRegistration.findOne({ seminar: seminar._id, email });
    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        registration: existing,
      });
    }

    const registration = await SeminarRegistration.create({
      seminar: seminar._id,
      user: user._id,
      name: name || user.name,
      phone: phone || user.phone || undefined,
      email,
    });

    return NextResponse.json({ ok: true, registration }, { status: 201 });
  } catch (error) {
    console.error("seminar register error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
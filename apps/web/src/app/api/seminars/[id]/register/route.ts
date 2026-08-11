import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { verifyIdToken } from "@/lib/auth/token";
import { Seminar, SeminarRegistration } from "@/lib/models/seminar";
import { User } from "@/lib/models/user";
import { emitEvent } from "@/lib/events/emit";
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

    const phone = body.phone?.trim() ?? "";
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    let email = body.email?.toLowerCase().trim() ?? "";
    let name = body.name?.trim() ?? "";
    let user = null;
    let userCreated = false;

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
        user = await User.findOne({ email });
        if (user) {
          user.name = name || user.name;
          user.phone = phone || user.phone;
          if (!user.avatar && claims.picture) user.avatar = claims.picture;
          await user.save();
        } else {
          user = await User.create({
            firebaseUid: claims.uid,
            name: name || email.split("@")[0],
            email,
            avatar: claims.picture,
            phone,
            accountType: "user",
            subscription: "free" as SubscriptionType,
          });
          userCreated = true;
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
        if (name) user.name = name || user.name;
        user.phone = phone || user.phone;
        await user.save();
      } else {
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          phone,
          accountType: "user",
          subscription: "free" as SubscriptionType,
        });
        userCreated = true;
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
      phone,
      email,
    });

    if (userCreated) {
      try {
        await emitEvent("user.registered", {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            accountType: user.accountType,
            subscription: user.subscription,
          },
        });
      } catch (emitError) {
        console.error("user.registered emit error", emitError);
      }
    }

    const emit = await emitEvent("seminar.registration_created", {
      registrationId: registration._id.toString(),
      user: {
        id: user._id.toString(),
        name: name || user.name,
        email,
        phone,
      },
      seminar: {
        id: seminar._id.toString(),
        title: seminar.title,
        description: seminar.description,
        dateTime: seminar.dateTime.toISOString(),
        duration: seminar.duration,
        type: seminar.type,
        price: seminar.price,
        url: seminar.url,
        image: seminar.image,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        registration,
        emailSent: emit.handlers.sendRegistrationConfirmationEmail?.ok ?? false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("seminar register error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
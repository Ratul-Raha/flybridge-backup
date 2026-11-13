import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Lead, LEAD_STATUSES } from "@/lib/models/lead";
import { getLeadDetail, serializeLead } from "@/lib/leads";
import type { LeadDoc } from "@/lib/models/lead";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const detail = await getLeadDetail(params.id);
    if (!detail) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (error) {
    console.error("admin lead detail GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();
    const lead = await Lead.findById(params.id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    if (typeof body.name === "string" && body.name.trim()) lead.name = body.name.trim();
    if (typeof body.phone === "string") lead.phone = body.phone.trim() || undefined;

    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!email) {
        lead.email = undefined;
      } else if (email !== lead.email) {
        const clash = await Lead.exists({ email, _id: { $ne: lead._id } });
        if (clash) {
          return NextResponse.json({ error: "A lead with that email already exists" }, { status: 409 });
        }
        lead.email = email;
      }
    }

    if (typeof body.status === "string" && (LEAD_STATUSES as readonly string[]).includes(body.status)) {
      lead.status = body.status as never;
      if (body.status === "converted" && !lead.convertedAt) lead.convertedAt = new Date();
      if (body.status !== "converted") lead.convertedAt = null;
    }

    if (body.owner === null || typeof body.owner === "string") {
      if (body.owner === "me") {
        lead.owner = session.userId ? new Types.ObjectId(session.userId) : null;
      } else {
        lead.owner =
          body.owner === null || !Types.ObjectId.isValid(body.owner)
            ? null
            : new Types.ObjectId(body.owner);
      }
    }

    if (body.followUpAt === null || typeof body.followUpAt === "string") {
      lead.followUpAt = body.followUpAt === null ? null : new Date(body.followUpAt);
    }

    if (body.lastContactedAt === null || typeof body.lastContactedAt === "string") {
      lead.lastContactedAt = body.lastContactedAt === null ? null : new Date(body.lastContactedAt);
    }

    if (Array.isArray(body.tags)) {
      lead.tags = body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20);
    }

    if (typeof body.note === "string" && body.note.trim()) {
      lead.notes.push({ body: body.note.trim().slice(0, 2000), author: session.userId ? new Types.ObjectId(session.userId) : null } as never);
      lead.lastContactedAt = new Date();
    }

    lead.lastActivityAt = new Date();
    await lead.save();

    return NextResponse.json({
      lead: serializeLead(lead as unknown as LeadDoc & Parameters<typeof serializeLead>[0]),
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "A lead with that email already exists" }, { status: 409 });
    }
    console.error("admin lead PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const lead = await Lead.findById(params.id);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    await lead.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin lead DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Lead, LEAD_STATUSES, LEAD_SOURCES } from "@/lib/models/lead";
import { Order } from "@/lib/models/order";
import { User } from "@/lib/models/user";
import { isLeadSource, serializeLead } from "@/lib/leads";
import type { LeadDoc } from "@/lib/models/lead";

type LeadRow = ReturnType<typeof serializeLead>;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const sp = request.nextUrl.searchParams;

    const page = Math.max(1, Number(sp.get("page")) || 1);
    const perPage = Math.min(100, Math.max(1, Number(sp.get("perPage")) || 25));

    const filter: Record<string, unknown> = {};

    const q = (sp.get("q") ?? "").trim();
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const status = sp.get("status");
    if (status && (LEAD_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }

    const source = sp.get("source");
    if (source && isLeadSource(source)) {
      filter.source = source;
    }

    const owner = sp.get("owner");
    if (owner === "unassigned") {
      filter.owner = null;
    } else if (owner === "mine") {
      filter.owner = session.userId ? new Types.ObjectId(session.userId) : null;
    } else if (owner && Types.ObjectId.isValid(owner)) {
      filter.owner = new Types.ObjectId(owner);
    }

    const followup = sp.get("followup");
    const now = new Date();
    if (followup === "overdue") {
      filter.followUpAt = { $lt: now };
    } else if (followup === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.followUpAt = { $gte: start, $lt: end };
    } else if (followup === "upcoming") {
      filter.followUpAt = { $gte: now };
    } else if (followup === "none") {
      filter.followUpAt = null;
    }

    const sortKey = sp.get("sort") ?? "newest";
    const sort: Record<string, 1 | -1> =
      sortKey === "followup"
        ? { followUpAt: 1, createdAt: -1 }
        : sortKey === "oldest"
          ? { createdAt: 1 }
          : { createdAt: -1 };

    const [total, leads, statusRows, overdue, unassigned] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .sort(sort)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean(),
      Lead.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Lead.countDocuments({ followUpAt: { $lt: now }, status: { $nin: ["converted", "not-interested", "unqualified"] } }),
      Lead.countDocuments({ owner: null }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of statusRows) statusCounts[row._id] = row.count;

    // Mark which leads have already purchased, without a heavy join per row.
    const emails = leads.map((l) => (l.email ?? "").trim().toLowerCase()).filter(Boolean);
    const userIds = leads
      .map((l) => (l.user ? String(l.user) : ""))
      .filter((v) => v && Types.ObjectId.isValid(v))
      .map((v) => new Types.ObjectId(v));

    const [paidEmails, paidUsers] = await Promise.all([
      emails.length
        ? Order.distinct("email", {
            status: { $in: ["completed", "refunded"] },
            email: { $in: emails },
          })
        : Promise.resolve([]),
      userIds.length
        ? Order.distinct("user", {
            status: { $in: ["completed", "refunded"] },
            user: { $in: userIds },
          })
        : Promise.resolve([]),
    ]);

    const paidEmailSet = new Set((paidEmails as string[]).map((e) => String(e).toLowerCase()));
    const paidUserSet = new Set((paidUsers as Types.ObjectId[]).map((u) => String(u)));

    const rows: (LeadRow & { customer: boolean })[] = leads.map((l) => {
      const lead = serializeLead(l as unknown as LeadDoc & Parameters<typeof serializeLead>[0]);
      const customer = Boolean(
        (lead.email && paidEmailSet.has(lead.email.toLowerCase())) ||
          (lead.user && paidUserSet.has(lead.user))
      );
      return { ...lead, customer };
    });

    return NextResponse.json({
      stats: {
        total,
        ...statusCounts,
        overdue,
        unassigned,
      },
      leads: rows,
      pagination: { page, perPage, total },
    });
  } catch (error) {
    console.error("admin leads GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    await connectDb();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "A name is required" }, { status: 400 });

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!email && !phone) {
      return NextResponse.json({ error: "An email or phone is required" }, { status: 400 });
    }

    if (email && (await Lead.exists({ email }))) {
      return NextResponse.json({ error: "A lead with that email already exists" }, { status: 409 });
    }

    let userId =
      typeof body.userId === "string" && Types.ObjectId.isValid(body.userId)
        ? new Types.ObjectId(body.userId)
        : null;
    if (!userId && email) {
      const user = await User.findOne({ email }).select("_id").lean();
      if (user) userId = user._id;
    }

    const owner =
      typeof body.owner === "string" && Types.ObjectId.isValid(body.owner)
        ? new Types.ObjectId(body.owner)
        : null;

    const lead = await Lead.create({
      user: userId,
      name,
      email: email || undefined,
      phone: phone || undefined,
      status: "new",
      source: isLeadSource(body.source) ? body.source : "manual",
      owner,
      interests:
        body.interest && typeof body.interest === "object"
          ? [
              {
                itemType: String((body.interest as Record<string, unknown>).itemType ?? ""),
                itemId: String((body.interest as Record<string, unknown>).itemId ?? ""),
                title: String((body.interest as Record<string, unknown>).title ?? ""),
                createdAt: new Date(),
              },
            ]
          : [],
      lastActivityAt: new Date(),
    });

    return NextResponse.json(
      { lead: serializeLead(lead as unknown as LeadDoc & Parameters<typeof serializeLead>[0]) },
      { status: 201 }
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "A lead with that email already exists" }, { status: 409 });
    }
    console.error("admin leads POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

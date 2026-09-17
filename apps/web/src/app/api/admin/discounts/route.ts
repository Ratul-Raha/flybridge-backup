import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Discount, type DiscountDoc } from "@/lib/models/discount";
import { Order } from "@/lib/models/order";
import { parseDiscountInput, serializeDiscount } from "@/lib/discount-input";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const discounts = await Discount.find().sort({ createdAt: -1 });
    const counts = await Order.aggregate([
      { $match: { discountId: { $ne: null }, status: { $in: ["pending", "completed"] } } },
      { $group: { _id: "$discountId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count as number]));

    return NextResponse.json({
      discounts: discounts.map((d) =>
        serializeDiscount(d, countMap.get(d._id.toString()) ?? 0)
      ),
    });
  } catch (error) {
    console.error("admin discounts GET error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const input = parseDiscountInput(body);
    if ("error" in input) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    await connectDb();
    if (input.code) {
      const clash = await Discount.findOne({ code: input.code });
      if (clash) {
        return NextResponse.json({ error: `Code "${input.code}" is already in use` }, { status: 409 });
      }
    }

    const discount = await Discount.create({
      ...input,
      code: input.code ?? undefined,
      createdBy: session.userId,
      updatedBy: session.userId,
    });

    return NextResponse.json(
      { discount: serializeDiscount(discount as DiscountDoc) },
      { status: 201 }
    );
  } catch (error) {
    console.error("admin discounts POST error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

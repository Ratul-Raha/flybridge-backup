import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { Discount, type DiscountDoc } from "@/lib/models/discount";
import { parseDiscountInput, serializeDiscount } from "@/lib/discount-input";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const input = parseDiscountInput(body);
    if ("error" in input) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    await connectDb();
    const existing = await Discount.findById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    if (input.code) {
      const clash = await Discount.findOne({ code: input.code, _id: { $ne: existing._id } });
      if (clash) {
        return NextResponse.json({ error: `Code "${input.code}" is already in use` }, { status: 409 });
      }
    }

    const { code, ...rest } = input;
    const discount = await Discount.findByIdAndUpdate(
      existing._id,
      code
        ? { $set: { ...rest, code, updatedBy: session.userId } }
        : { $set: { ...rest, updatedBy: session.userId }, $unset: { code: 1 } },
      { new: true }
    );
    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    return NextResponse.json({ discount: serializeDiscount(discount as DiscountDoc) });
  } catch (error) {
    console.error("admin discounts PATCH error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await connectDb();
    const deleted = await Discount.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin discounts DELETE error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

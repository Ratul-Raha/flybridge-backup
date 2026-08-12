import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { EVENT_CATALOG, EVENT_LIST, isEventName } from "@/lib/events/catalog";
import { emitEvent } from "@/lib/events/emit";

export const maxDuration = 300;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    events: EVENT_LIST.map((e) => ({
      name: e.name,
      label: e.label,
      description: e.description,
      fields: e.fields,
      samplePayload: e.samplePayload(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const event = body?.event;
    if (!isEventName(event)) {
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }
    const payload = body?.payload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Payload must be a JSON object" }, { status: 400 });
    }

    const result = await emitEvent(event, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("events POST (emit) error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

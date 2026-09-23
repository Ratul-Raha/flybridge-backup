import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { removeDevice } from "@/lib/auth/devices";

export async function DELETE(
  _request: Request,
  { params }: { params: { deviceId: string } }
) {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deviceId = params.deviceId;
  if (!deviceId) {
    return NextResponse.json({ error: "Invalid device" }, { status: 400 });
  }

  try {
    const removed = await removeDevice(session.userId, deviceId);
    if (!removed) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("devices DELETE error", error);
    return NextResponse.json({ error: "Failed to remove device" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { listDevices, readDeviceId } from "@/lib/auth/devices";

export async function GET() {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const current = readDeviceId();
    const devices = await listDevices(session.userId);
    return NextResponse.json({
      devices: devices.map((d) => ({ ...d, current: d.deviceId === current })),
      limit: 2,
    });
  } catch (error) {
    console.error("devices GET error", error);
    return NextResponse.json({ error: "Failed to load devices" }, { status: 500 });
  }
}
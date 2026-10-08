import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";

export async function GET() {
  const session = await readSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    return NextResponse.json(
      { error: "Azure Speech is not configured" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: { "Ocp-Apim-Subscription-Key": key },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `speech token request failed (${response.status}): ${await response.text().catch(() => "")}`
      );
      const detail =
        response.status === 401 || response.status === 403
          ? "Azure rejected the key (check AZURE_SPEECH_KEY and that AZURE_SPEECH_REGION matches the resource region)"
          : `Azure Speech is unavailable (${response.status})`;
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    return NextResponse.json(
      {
        token: await response.text(),
        region,
        locale: process.env.AZURE_SPEECH_RECOG_LANG || "en-US",
        voice: process.env.AZURE_SPEECH_VOICE || "en-US-JennyNeural",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("speech token error", error);
    return NextResponse.json(
      { error: "Could not connect to Azure Speech" },
      { status: 502 }
    );
  }
}

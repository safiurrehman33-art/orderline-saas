import { NextResponse } from "next/server";
import { getMetaWhatsAppServerConfig } from "@/lib/whatsapp/config";
import { verifyMetaWebhookSignature } from "@/lib/whatsapp/meta-graph";
import { processWhatsAppWebhook } from "@/lib/whatsapp/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta webhook verification challenge */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const { verifyToken } = getMetaWhatsAppServerConfig();

  if (!verifyToken) {
    return NextResponse.json(
      { error: "META_WHATSAPP_VERIFY_TOKEN is not configured." },
      { status: 503 },
    );
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Incoming WhatsApp events from Meta */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const { appSecret } = getMetaWhatsAppServerConfig();

  // Require signature whenever app secret is configured
  if (appSecret) {
    const ok = verifyMetaWebhookSignature(rawBody, signature);
    if (!ok) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // Acknowledge quickly; Meta retries on non-2xx
    const result = await processWhatsAppWebhook(
      payload as Parameters<typeof processWhatsAppWebhook>[0],
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[whatsapp.webhook]", error);
    // Still 200 to avoid infinite Meta retries on poison payloads;
    // operational errors are logged for investigation.
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Webhook processing failed",
    });
  }
}

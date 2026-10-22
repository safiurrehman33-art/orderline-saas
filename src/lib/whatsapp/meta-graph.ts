import { createHmac, timingSafeEqual } from "crypto";
import { getMetaWhatsAppServerConfig } from "@/lib/whatsapp/config";

type GraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export class MetaGraphError extends Error {
  code?: number;
  type?: string;
  fbtraceId?: string;

  constructor(message: string, details?: GraphErrorBody["error"]) {
    super(message);
    this.name = "MetaGraphError";
    this.code = details?.code;
    this.type = details?.type;
    this.fbtraceId = details?.fbtrace_id;
  }
}

function graphBase() {
  const { graphVersion } = getMetaWhatsAppServerConfig();
  return `https://graph.facebook.com/${graphVersion}`;
}

async function parseGraphResponse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
  if (!res.ok || json.error) {
    const message =
      json.error?.message ||
      `Meta Graph API error (${res.status})`;
    throw new MetaGraphError(message, json.error);
  }
  return json;
}

export async function exchangeEmbeddedSignupCode(code: string) {
  const { appId, appSecret } = getMetaWhatsAppServerConfig();
  if (!appId || !appSecret) {
    throw new MetaGraphError(
      "Meta App ID / App Secret are not configured on the server.",
    );
  }
  if (!code.trim()) {
    throw new MetaGraphError("Missing authorization code from Meta signup.");
  }

  const url = new URL(`${graphBase()}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code.trim());

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const data = await parseGraphResponse<{
    access_token: string;
    token_type?: string;
    expires_in?: number;
  }>(res);

  if (!data.access_token) {
    throw new MetaGraphError("Meta did not return an access token.");
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? null,
  };
}

export async function fetchPhoneNumberProfile(
  phoneNumberId: string,
  accessToken: string,
) {
  const url = new URL(`${graphBase()}/${encodeURIComponent(phoneNumberId)}`);
  url.searchParams.set(
    "fields",
    "id,display_phone_number,verified_name,quality_rating,code_verification_status",
  );

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return parseGraphResponse<{
    id: string;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
    code_verification_status?: string;
  }>(res);
}

/** Subscribe the app to WABA webhooks (uses Meta App dashboard callback URL). */
export async function subscribeAppToWaba(
  wabaId: string,
  accessToken: string,
) {
  const res = await fetch(
    `${graphBase()}/${encodeURIComponent(wabaId)}/subscribed_apps`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );
  return parseGraphResponse<{ success?: boolean }>(res);
}

/**
 * Optional: pin/register phone for Cloud API.
 * Safe to call; ignores "already registered" style errors.
 */
export async function registerPhoneNumber(
  phoneNumberId: string,
  accessToken: string,
  pin = "123456",
) {
  try {
    const res = await fetch(
      `${graphBase()}/${encodeURIComponent(phoneNumberId)}/register`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin,
        }),
      },
    );
    return await parseGraphResponse<{ success?: boolean }>(res);
  } catch (error) {
    if (error instanceof MetaGraphError) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        error.code === 100
      ) {
        return { success: true, skipped: true as const };
      }
    }
    throw error;
  }
}

export async function sendWhatsAppTextMessage(input: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}) {
  const to = input.to.replace(/\D/g, "");
  const res = await fetch(
    `${graphBase()}/${encodeURIComponent(input.phoneNumberId)}/messages`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: input.body },
      }),
    },
  );

  return parseGraphResponse<{
    messages?: { id: string }[];
  }>(res);
}

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const { appSecret } = getMetaWhatsAppServerConfig();
  if (!appSecret) return false;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function normalizeE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("+")) return cleaned;
  return `+${cleaned.replace(/\D/g, "")}`;
}

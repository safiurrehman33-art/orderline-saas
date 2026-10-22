import { db } from "@/lib/db";
import { encryptSecret, hashToken } from "@/lib/crypto/secrets";
import { getMetaWhatsAppServerConfig } from "@/lib/whatsapp/config";
import {
  MetaGraphError,
  exchangeEmbeddedSignupCode,
  fetchPhoneNumberProfile,
  normalizeE164,
  registerPhoneNumber,
  subscribeAppToWaba,
} from "@/lib/whatsapp/meta-graph";

export type ConnectWhatsAppInput = {
  organizationId: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessId?: string | null;
  displayPhoneNumber?: string | null;
  source: "embedded_signup" | "manual";
  expiresInSeconds?: number | null;
};

async function ensureChatbotRow(organizationId: string, connectionId: string) {
  await db.whatsAppChatbotConfig.upsert({
    where: { organizationId },
    create: { organizationId, connectionId },
    update: {},
  });
}

export async function finalizeWhatsAppConnection(input: ConnectWhatsAppInput) {
  const phoneNumberId = input.phoneNumberId.trim();
  const wabaId = input.wabaId.trim();
  const accessToken = input.accessToken.trim();

  if (!phoneNumberId || !wabaId || !accessToken) {
    throw new Error("Phone Number ID, WABA ID, and access token are required.");
  }

  // Prevent two orgs claiming the same Meta phone number
  const taken = await db.whatsAppConnection.findFirst({
    where: {
      phoneNumberId,
      NOT: { organizationId: input.organizationId },
    },
    select: { organizationId: true },
  });
  if (taken) {
    throw new Error(
      "This WhatsApp phone number is already linked to another workspace.",
    );
  }

  let profile: Awaited<ReturnType<typeof fetchPhoneNumberProfile>> | null =
    null;
  try {
    profile = await fetchPhoneNumberProfile(phoneNumberId, accessToken);
  } catch (error) {
    const message =
      error instanceof MetaGraphError
        ? error.message
        : "Could not verify phone number with Meta.";
    throw new Error(
      `Meta rejected these credentials: ${message}. Check Phone Number ID and token.`,
    );
  }

  try {
    await subscribeAppToWaba(wabaId, accessToken);
  } catch (error) {
    // Soft-fail: connection can still work if app webhook is already subscribed
    console.warn(
      "[whatsapp] WABA subscribe warning:",
      error instanceof Error ? error.message : error,
    );
  }

  try {
    await registerPhoneNumber(phoneNumberId, accessToken);
  } catch (error) {
    console.warn(
      "[whatsapp] phone register warning:",
      error instanceof Error ? error.message : error,
    );
  }

  const { verifyToken } = getMetaWhatsAppServerConfig();
  const displayPhoneNumber =
    normalizeE164(input.displayPhoneNumber) ||
    normalizeE164(profile.display_phone_number?.replace(/\s+/g, "")) ||
    null;

  const tokenExpiresAt =
    input.expiresInSeconds && input.expiresInSeconds > 0
      ? new Date(Date.now() + input.expiresInSeconds * 1000)
      : null;

  const connection = await db.whatsAppConnection.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      status: "CONNECTED",
      phoneNumberId,
      wabaId,
      metaBusinessId: input.businessId?.trim() || null,
      displayPhoneNumber,
      verifiedName: profile.verified_name ?? null,
      accessTokenEnc: encryptSecret(accessToken),
      tokenExpiresAt,
      webhookVerifyTokenHash: verifyToken ? hashToken(verifyToken) : null,
      connectedAt: new Date(),
      lastError: null,
    },
    update: {
      status: "CONNECTED",
      phoneNumberId,
      wabaId,
      metaBusinessId: input.businessId?.trim() || null,
      displayPhoneNumber,
      verifiedName: profile.verified_name ?? null,
      accessTokenEnc: encryptSecret(accessToken),
      tokenExpiresAt,
      webhookVerifyTokenHash: verifyToken ? hashToken(verifyToken) : null,
      connectedAt: new Date(),
      lastError: null,
    },
  });

  await ensureChatbotRow(input.organizationId, connection.id);

  return {
    connection,
    profile,
    source: input.source,
  };
}

export async function connectFromEmbeddedSignup(input: {
  organizationId: string;
  code: string;
  phoneNumberId: string;
  wabaId: string;
  businessId?: string | null;
}) {
  const { accessToken, expiresIn } = await exchangeEmbeddedSignupCode(
    input.code,
  );
  return finalizeWhatsAppConnection({
    organizationId: input.organizationId,
    accessToken,
    phoneNumberId: input.phoneNumberId,
    wabaId: input.wabaId,
    businessId: input.businessId,
    source: "embedded_signup",
    expiresInSeconds: expiresIn,
  });
}

export async function markWhatsAppConnectionError(
  organizationId: string,
  message: string,
) {
  await db.whatsAppConnection.updateMany({
    where: { organizationId },
    data: {
      status: "ERROR",
      lastError: message.slice(0, 1000),
    },
  });
}

export async function disconnectWhatsAppConnection(organizationId: string) {
  const connection = await db.whatsAppConnection.findUnique({
    where: { organizationId },
  });
  if (!connection) return null;

  // Keep chatbot config; clear secrets and Meta IDs
  const updated = await db.whatsAppConnection.update({
    where: { id: connection.id },
    data: {
      status: "DISCONNECTED",
      phoneNumberId: null,
      wabaId: null,
      metaBusinessId: null,
      accessTokenEnc: null,
      tokenExpiresAt: null,
      webhookVerifyTokenHash: null,
      connectedAt: null,
      lastError: null,
      verifiedName: null,
      // keep displayPhoneNumber so owner can reconnect easily
    },
  });

  await db.whatsAppChatbotConfig.updateMany({
    where: { organizationId },
    data: { mode: "OFF" },
  });

  return updated;
}

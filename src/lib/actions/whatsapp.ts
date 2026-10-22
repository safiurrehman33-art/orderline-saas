"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auditFromTenant } from "@/lib/audit";
import { requirePermission } from "@/lib/tenant";
import type { ActionState } from "@/lib/actions/auth";
import type { WhatsAppBotMode } from "@/generated/prisma/client";
import {
  connectFromEmbeddedSignup,
  disconnectWhatsAppConnection,
  finalizeWhatsAppConnection,
  markWhatsAppConnectionError,
} from "@/lib/whatsapp/connect";
import { decryptSecret } from "@/lib/crypto/secrets";
import {
  MetaGraphError,
  fetchPhoneNumberProfile,
} from "@/lib/whatsapp/meta-graph";
import { getMetaWhatsAppServerConfig } from "@/lib/whatsapp/config";

function parseBool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function parseKeywords(raw: string) {
  return [
    ...new Set(
      raw
        .split(/[,|\n]/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 20);
}

const TONES = new Set(["friendly", "professional", "casual"]);
const LANGUAGES = new Set(["en", "ur", "ar", "hi", "es", "fr"]);

export async function updateWhatsAppChatbotAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("whatsapp:manage");

  const displayName =
    String(formData.get("displayName") ?? "").trim() || "OrderLine Assistant";
  const greetingMessage = String(formData.get("greetingMessage") ?? "").trim();
  const fallbackMessage = String(formData.get("fallbackMessage") ?? "").trim();
  const language = String(formData.get("language") ?? "en").trim();
  const tone = String(formData.get("tone") ?? "friendly").trim();
  const systemPromptExtra =
    String(formData.get("systemPromptExtra") ?? "").trim() || null;
  const offlineMessage =
    String(formData.get("offlineMessage") ?? "").trim() || null;
  const handoffKeywords = parseKeywords(
    String(formData.get("handoffKeywords") ?? ""),
  );
  const maxReplyTokens = Math.min(
    2000,
    Math.max(200, Number(formData.get("maxReplyTokens") ?? 800) || 800),
  );

  if (!greetingMessage || greetingMessage.length < 10) {
    return { error: "Greeting message should be at least 10 characters." };
  }
  if (!fallbackMessage || fallbackMessage.length < 10) {
    return { error: "Fallback message should be at least 10 characters." };
  }
  if (!LANGUAGES.has(language)) {
    return { error: "Unsupported language." };
  }
  if (!TONES.has(tone)) {
    return { error: "Unsupported tone." };
  }

  let connection = await db.whatsAppConnection.findUnique({
    where: { organizationId: tenant.organizationId },
  });
  if (!connection) {
    connection = await db.whatsAppConnection.create({
      data: { organizationId: tenant.organizationId },
    });
  }

  await db.whatsAppChatbotConfig.upsert({
    where: { organizationId: tenant.organizationId },
    create: {
      organizationId: tenant.organizationId,
      connectionId: connection.id,
      displayName,
      greetingMessage,
      fallbackMessage,
      language,
      tone,
      canBrowseMenu: parseBool(formData, "canBrowseMenu"),
      canTakeOrders: parseBool(formData, "canTakeOrders"),
      canTrackOrders: parseBool(formData, "canTrackOrders"),
      canAnswerFaq: parseBool(formData, "canAnswerFaq"),
      allowDelivery: parseBool(formData, "allowDelivery"),
      allowTakeaway: parseBool(formData, "allowTakeaway"),
      allowDineIn: parseBool(formData, "allowDineIn"),
      businessHoursEnabled: parseBool(formData, "businessHoursEnabled"),
      offlineMessage,
      humanHandoffEnabled: parseBool(formData, "humanHandoffEnabled"),
      handoffKeywords:
        handoffKeywords.length > 0
          ? handoffKeywords
          : ["agent", "human", "staff", "help"],
      systemPromptExtra,
      maxReplyTokens,
    },
    update: {
      displayName,
      greetingMessage,
      fallbackMessage,
      language,
      tone,
      canBrowseMenu: parseBool(formData, "canBrowseMenu"),
      canTakeOrders: parseBool(formData, "canTakeOrders"),
      canTrackOrders: parseBool(formData, "canTrackOrders"),
      canAnswerFaq: parseBool(formData, "canAnswerFaq"),
      allowDelivery: parseBool(formData, "allowDelivery"),
      allowTakeaway: parseBool(formData, "allowTakeaway"),
      allowDineIn: parseBool(formData, "allowDineIn"),
      businessHoursEnabled: parseBool(formData, "businessHoursEnabled"),
      offlineMessage,
      humanHandoffEnabled: parseBool(formData, "humanHandoffEnabled"),
      handoffKeywords:
        handoffKeywords.length > 0
          ? handoffKeywords
          : ["agent", "human", "staff", "help"],
      systemPromptExtra,
      maxReplyTokens,
    },
  });

  await auditFromTenant(tenant, {
    action: "whatsapp.chatbot_updated",
    entityType: "whatsapp_chatbot",
    entityId: connection.id,
    summary: `Updated WhatsApp chatbot config (${displayName})`,
  });

  revalidatePath("/whatsapp");
  return { success: "Chatbot settings saved." };
}

export async function setWhatsAppBotModeAction(
  mode: WhatsAppBotMode,
): Promise<ActionState> {
  const tenant = await requirePermission("whatsapp:manage");

  const connection = await db.whatsAppConnection.findUnique({
    where: { organizationId: tenant.organizationId },
  });
  const chatbot = await db.whatsAppChatbotConfig.findUnique({
    where: { organizationId: tenant.organizationId },
  });

  if (!connection || !chatbot) {
    return { error: "WhatsApp module is not initialized yet." };
  }

  if (mode === "ACTIVE" && connection.status !== "CONNECTED") {
    return {
      error:
        "Connect your WhatsApp Business number first (Step 2), then activate the chatbot.",
    };
  }

  await db.whatsAppChatbotConfig.update({
    where: { id: chatbot.id },
    data: { mode },
  });

  await auditFromTenant(tenant, {
    action: "whatsapp.bot_mode",
    entityType: "whatsapp_chatbot",
    entityId: chatbot.id,
    summary: `WhatsApp chatbot mode → ${mode}`,
    metadata: { mode },
  });

  revalidatePath("/whatsapp");
  return {
    success:
      mode === "ACTIVE"
        ? "Chatbot is live on your WhatsApp number."
        : mode === "PAUSED"
          ? "Chatbot paused — messages stay in inbox for staff."
          : "Chatbot turned off.",
  };
}

export async function saveWhatsAppDisplayPhoneAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("whatsapp:manage");
  const raw = String(formData.get("displayPhoneNumber") ?? "").trim();

  if (!raw) {
    return { error: "Enter your business WhatsApp number." };
  }

  // Soft normalize: keep + and digits
  const normalized = raw.replace(/[^\d+]/g, "");
  if (!/^\+?\d{8,15}$/.test(normalized)) {
    return {
      error: "Use international format, e.g. +923001234567",
    };
  }

  const displayPhoneNumber = normalized.startsWith("+")
    ? normalized
    : `+${normalized}`;

  const existing = await db.whatsAppConnection.findUnique({
    where: { organizationId: tenant.organizationId },
  });

  const nextStatus =
    existing?.status === "CONNECTED" || existing?.status === "ERROR"
      ? existing.status
      : "PENDING";

  const connection = await db.whatsAppConnection.upsert({
    where: { organizationId: tenant.organizationId },
    create: {
      organizationId: tenant.organizationId,
      displayPhoneNumber,
      status: "PENDING",
    },
    update: {
      displayPhoneNumber,
      status: nextStatus,
    },
  });

  // Ensure chatbot config row exists
  await db.whatsAppChatbotConfig.upsert({
    where: { organizationId: tenant.organizationId },
    create: {
      organizationId: tenant.organizationId,
      connectionId: connection.id,
    },
    update: {},
  });

  await auditFromTenant(tenant, {
    action: "whatsapp.number_saved",
    entityType: "whatsapp_connection",
    entityId: connection.id,
    summary: `Saved WhatsApp business number ${displayPhoneNumber}`,
  });

  revalidatePath("/whatsapp");
  return {
    success:
      "Number saved. Next step: connect it officially with Meta (Step 2).",
  };
}

export async function completeWhatsAppEmbeddedSignupAction(input: {
  code: string;
  phoneNumberId: string;
  wabaId: string;
  businessId?: string | null;
}): Promise<ActionState> {
  const tenant = await requirePermission("whatsapp:manage");
  const cfg = getMetaWhatsAppServerConfig();

  if (!cfg.embeddedSignupServerReady) {
    return {
      error:
        "Embedded Signup is not configured. Set META_APP_ID, META_APP_SECRET, and META_EMBEDDED_SIGNUP_CONFIG_ID — or use Manual Cloud API connect.",
    };
  }

  try {
    const result = await connectFromEmbeddedSignup({
      organizationId: tenant.organizationId,
      code: input.code,
      phoneNumberId: input.phoneNumberId,
      wabaId: input.wabaId,
      businessId: input.businessId,
    });

    await auditFromTenant(tenant, {
      action: "whatsapp.connected",
      entityType: "whatsapp_connection",
      entityId: result.connection.id,
      summary: `Connected WhatsApp via Embedded Signup (${result.connection.displayPhoneNumber ?? result.connection.phoneNumberId})`,
      metadata: {
        source: "embedded_signup",
        phoneNumberId: result.connection.phoneNumberId,
        wabaId: result.connection.wabaId,
      },
    });

    revalidatePath("/whatsapp");
    return {
      success: `Connected ${result.connection.displayPhoneNumber ?? "WhatsApp number"}. You can Activate the chatbot now.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Embedded Signup failed.";
    await markWhatsAppConnectionError(tenant.organizationId, message);
    revalidatePath("/whatsapp");
    return { error: message };
  }
}

export async function connectWhatsAppManualAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("whatsapp:manage");

  const phoneNumberId = String(formData.get("phoneNumberId") ?? "").trim();
  const wabaId = String(formData.get("wabaId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();
  const displayPhoneNumber = String(
    formData.get("displayPhoneNumber") ?? "",
  ).trim();
  const businessId = String(formData.get("businessId") ?? "").trim() || null;

  if (!phoneNumberId || !wabaId || !accessToken) {
    return {
      error: "Phone Number ID, WABA ID, and Access Token are required.",
    };
  }

  try {
    const result = await finalizeWhatsAppConnection({
      organizationId: tenant.organizationId,
      phoneNumberId,
      wabaId,
      accessToken,
      businessId,
      displayPhoneNumber: displayPhoneNumber || null,
      source: "manual",
    });

    await auditFromTenant(tenant, {
      action: "whatsapp.connected",
      entityType: "whatsapp_connection",
      entityId: result.connection.id,
      summary: `Connected WhatsApp via Cloud API credentials (${result.connection.displayPhoneNumber ?? phoneNumberId})`,
      metadata: {
        source: "manual",
        phoneNumberId,
        wabaId,
      },
    });

    revalidatePath("/whatsapp");
    return {
      success: `Connected ${result.connection.displayPhoneNumber ?? "WhatsApp number"}. You can Activate the chatbot now.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Manual connect failed.";
    await markWhatsAppConnectionError(tenant.organizationId, message);
    revalidatePath("/whatsapp");
    return { error: message };
  }
}

export async function verifyWhatsAppConnectionAction(): Promise<ActionState> {
  const tenant = await requirePermission("whatsapp:manage");
  const connection = await db.whatsAppConnection.findUnique({
    where: { organizationId: tenant.organizationId },
  });

  if (!connection?.phoneNumberId || !connection.accessTokenEnc) {
    return { error: "No WhatsApp connection to verify." };
  }

  try {
    const token = decryptSecret(connection.accessTokenEnc);
    const profile = await fetchPhoneNumberProfile(
      connection.phoneNumberId,
      token,
    );

    await db.whatsAppConnection.update({
      where: { id: connection.id },
      data: {
        status: "CONNECTED",
        verifiedName: profile.verified_name ?? connection.verifiedName,
        displayPhoneNumber:
          profile.display_phone_number?.replace(/\s/g, "") ||
          connection.displayPhoneNumber,
        lastError: null,
      },
    });

    await auditFromTenant(tenant, {
      action: "whatsapp.verified",
      entityType: "whatsapp_connection",
      entityId: connection.id,
      summary: `Verified WhatsApp connection (${profile.display_phone_number ?? connection.phoneNumberId})`,
    });

    revalidatePath("/whatsapp");
    return {
      success: `Verified · ${profile.verified_name ?? "WhatsApp"} (${profile.display_phone_number ?? connection.phoneNumberId})`,
    };
  } catch (error) {
    const message =
      error instanceof MetaGraphError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Verification failed.";
    await markWhatsAppConnectionError(tenant.organizationId, message);
    revalidatePath("/whatsapp");
    return { error: message };
  }
}

export async function disconnectWhatsAppAction(): Promise<ActionState> {
  const tenant = await requirePermission("whatsapp:manage");

  const updated = await disconnectWhatsAppConnection(tenant.organizationId);
  if (!updated) {
    return { error: "Nothing to disconnect." };
  }

  await auditFromTenant(tenant, {
    action: "whatsapp.disconnected",
    entityType: "whatsapp_connection",
    entityId: updated.id,
    summary: "Disconnected WhatsApp Business number",
  });

  revalidatePath("/whatsapp");
  return {
    success: "WhatsApp disconnected. Chatbot turned off. Number kept for reconnect.",
  };
}

import { randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto/secrets";
import { normalizeE164, sendWhatsAppTextMessage } from "@/lib/whatsapp/meta-graph";
import { runWhatsAppAgent } from "@/lib/whatsapp/agent/run";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function simMessageId(prefix: string) {
  return `${prefix}_${randomBytes(10).toString("hex")}`;
}

export async function handleInboundCustomerMessage(input: {
  organizationId: string;
  customerWaId: string;
  text: string;
  customerName?: string | null;
  source: "meta" | "simulator";
  waMessageId?: string | null;
  mediaType?: string | null;
  payload?: object | null;
}) {
  const text = input.text.trim();
  if (!text) {
    return { error: "Empty message." as const };
  }

  const connection = await db.whatsAppConnection.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (!connection) {
    return { error: "WhatsApp is not set up for this workspace." as const };
  }

  // Simulator can work even if Meta isn't CONNECTED yet
  if (input.source === "meta" && connection.status !== "CONNECTED") {
    return { error: "WhatsApp connection is not active." as const };
  }

  const chatbot = await db.whatsAppChatbotConfig.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (!chatbot) {
    return { error: "Chatbot config missing." as const };
  }

  const now = new Date();
  const customerWaId = input.customerWaId.replace(/[^\d]/g, "");
  if (!customerWaId) {
    return { error: "Invalid customer WhatsApp id." as const };
  }

  const existingConversation = await db.whatsAppConversation.findUnique({
    where: {
      connectionId_customerWaId: {
        connectionId: connection.id,
        customerWaId,
      },
    },
  });

  const conversation = await db.whatsAppConversation.upsert({
    where: {
      connectionId_customerWaId: {
        connectionId: connection.id,
        customerWaId,
      },
    },
    create: {
      organizationId: input.organizationId,
      connectionId: connection.id,
      customerWaId,
      customerName: input.customerName ?? null,
      customerPhone: normalizeE164(customerWaId),
      status: "BOT",
      lastMessageAt: now,
      lastCustomerMessageAt: now,
      unreadCount: 1,
      metadata: asJson({ source: input.source }),
    },
    update: {
      ...(input.customerName ? { customerName: input.customerName } : {}),
      lastMessageAt: now,
      lastCustomerMessageAt: now,
      unreadCount: { increment: 1 },
      ...(existingConversation?.status === "CLOSED"
        ? { status: "OPEN" as const }
        : {}),
    },
  });

  const inbound = await db.whatsAppMessage.create({
    data: {
      organizationId: input.organizationId,
      conversationId: conversation.id,
      direction: "INBOUND",
      role: "CUSTOMER",
      status: "RECEIVED",
      waMessageId: input.waMessageId ?? simMessageId("sim_in"),
      body: text,
      mediaType: input.mediaType ?? null,
      payload: asJson({
        source: input.source,
        ...(input.payload ?? {}),
      }),
      createdAt: now,
    },
  });

  // Bot paused / human takeover / off
  if (chatbot.mode !== "ACTIVE" || conversation.botPaused || conversation.status === "HUMAN") {
    return {
      ok: true as const,
      conversationId: conversation.id,
      inboundMessageId: inbound.id,
      reply: null,
      skippedReason:
        chatbot.mode !== "ACTIVE"
          ? ("bot_off" as const)
          : ("human_takeover" as const),
      provider: null,
    };
  }

  // First message greeting shortcut only when brand-new conversation
  const isFirst = !existingConversation;
  let agentInput = text;
  if (isFirst && /^(hi|hello|hey|salam)\b/i.test(text)) {
    // Still run agent, but greeting is fine via agent/local
    agentInput = text;
  }

  const agent = await runWhatsAppAgent({
    organizationId: input.organizationId,
    conversationId: conversation.id,
    customerWaId,
    userMessage: agentInput,
  });

  let reply = agent.reply?.trim() || chatbot.fallbackMessage;
  if (isFirst && !agent.toolTrace.length && /^(hi|hello|hey|salam)\b/i.test(text)) {
    reply = chatbot.greetingMessage;
  }

  let waOutId: string | null = simMessageId("sim_out");
  let sendStatus: "SENT" | "FAILED" = "SENT";
  let sendError: string | null = null;

  if (input.source === "meta" && connection.phoneNumberId && connection.accessTokenEnc) {
    try {
      const token = decryptSecret(connection.accessTokenEnc);
      const sent = await sendWhatsAppTextMessage({
        phoneNumberId: connection.phoneNumberId,
        accessToken: token,
        to: customerWaId,
        body: reply,
      });
      waOutId = sent.messages?.[0]?.id ?? waOutId;
    } catch (error) {
      sendStatus = "FAILED";
      sendError = error instanceof Error ? error.message : "Send failed";
    }
  }

  const outbound = await db.whatsAppMessage.create({
    data: {
      organizationId: input.organizationId,
      conversationId: conversation.id,
      direction: "OUTBOUND",
      role: agent.handoff ? "SYSTEM" : "ASSISTANT",
      status: sendStatus,
      waMessageId: waOutId,
      body: reply,
      error: sendError,
      payload: asJson({
        source: input.source,
        provider: agent.provider,
        toolTrace: agent.toolTrace,
        handoff: agent.handoff,
      }),
    },
  });

  await db.whatsAppConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      ...(agent.handoff
        ? { status: "HUMAN", botPaused: true }
        : conversation.status === "OPEN" || conversation.status === "BOT"
          ? { status: "BOT" }
          : {}),
    },
  });

  if (input.source === "meta") {
    await db.whatsAppConnection.update({
      where: { id: connection.id },
      data: { lastWebhookAt: new Date() },
    });
  }

  return {
    ok: true as const,
    conversationId: conversation.id,
    inboundMessageId: inbound.id,
    outboundMessageId: outbound.id,
    reply,
    provider: agent.provider,
    handoff: agent.handoff,
    toolTrace: agent.toolTrace,
    sendStatus,
    sendError,
  };
}

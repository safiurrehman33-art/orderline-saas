import { db } from "@/lib/db";
import { handleInboundCustomerMessage } from "@/lib/whatsapp/pipeline";

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: { name?: string };
        }>;
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          button?: { text?: string };
          interactive?: {
            button_reply?: { title?: string };
            list_reply?: { title?: string };
          };
          image?: { id?: string; caption?: string; mime_type?: string };
          document?: {
            id?: string;
            filename?: string;
            caption?: string;
            mime_type?: string;
          };
        }>;
        statuses?: Array<{
          id?: string;
          status?: string;
          timestamp?: string;
          recipient_id?: string;
          errors?: Array<{ code?: number; title?: string; message?: string }>;
        }>;
      };
    }>;
  }>;
};

type InboundMessage = NonNullable<
  NonNullable<
    NonNullable<MetaWebhookPayload["entry"]>[number]["changes"]
  >[number]["value"]
>["messages"] extends Array<infer M> | undefined
  ? M
  : never;

function extractInboundText(message: InboundMessage): string | null {
  if (!message) return null;
  if (message.type === "text" && message.text?.body) return message.text.body;
  if (message.button?.text) return message.button.text;
  if (message.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }
  if (message.interactive?.list_reply?.title) {
    return message.interactive.list_reply.title;
  }
  if (message.image?.caption) return message.image.caption;
  if (message.document?.caption) return message.document.caption;
  if (message.type) return `[${message.type}]`;
  return null;
}

export async function processWhatsAppWebhook(payload: MetaWebhookPayload) {
  if (payload.object !== "whatsapp_business_account") {
    return { handled: false, reason: "ignored_object" as const };
  }

  let messagesStored = 0;
  let statusesUpdated = 0;
  let agentReplies = 0;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value) continue;

      const phoneNumberId = value.metadata?.phone_number_id?.trim();
      if (!phoneNumberId) continue;

      const connection = await db.whatsAppConnection.findUnique({
        where: { phoneNumberId },
      });
      if (!connection || connection.status !== "CONNECTED") {
        continue;
      }

      await db.whatsAppConnection.update({
        where: { id: connection.id },
        data: { lastWebhookAt: new Date() },
      });

      const contactByWa = new Map(
        (value.contacts ?? []).map((c) => [c.wa_id ?? "", c]),
      );

      for (const status of value.statuses ?? []) {
        if (!status.id || !status.status) continue;
        const mapped =
          status.status === "delivered"
            ? "DELIVERED"
            : status.status === "read"
              ? "READ"
              : status.status === "failed"
                ? "FAILED"
                : status.status === "sent"
                  ? "SENT"
                  : null;
        if (!mapped) continue;

        const updated = await db.whatsAppMessage.updateMany({
          where: {
            waMessageId: status.id,
            organizationId: connection.organizationId,
          },
          data: {
            status: mapped,
            error:
              status.errors?.[0]?.message ||
              status.errors?.[0]?.title ||
              null,
          },
        });
        statusesUpdated += updated.count;
      }

      for (const message of value.messages ?? []) {
        if (!message.from || !message.id) continue;

        const existing = await db.whatsAppMessage.findUnique({
          where: { waMessageId: message.id },
          select: { id: true },
        });
        if (existing) continue;

        const body = extractInboundText(message);
        if (!body) continue;

        const contact = contactByWa.get(message.from);
        const result = await handleInboundCustomerMessage({
          organizationId: connection.organizationId,
          customerWaId: message.from,
          text: body,
          customerName: contact?.profile?.name ?? null,
          source: "meta",
          waMessageId: message.id,
          mediaType:
            message.type && message.type !== "text" ? message.type : null,
          payload: message as object,
        });

        if ("ok" in result && result.ok) {
          messagesStored += 1;
          if (result.reply) agentReplies += 1;
        }
      }
    }
  }

  return { handled: true, messagesStored, statusesUpdated, agentReplies };
}

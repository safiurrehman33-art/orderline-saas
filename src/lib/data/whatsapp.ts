import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";

const DEFAULT_GREETING =
  "Hi! Welcome to our restaurant. I can help with the menu, deals, and placing an order.";
const DEFAULT_FALLBACK =
  "Sorry — I didn’t catch that. You can ask about the menu, deals, or type *agent* to talk to our team.";

export async function getWhatsAppModuleData() {
  const tenant = await requirePermission("whatsapp:read");

  let connection = await db.whatsAppConnection.findUnique({
    where: { organizationId: tenant.organizationId },
  });

  let chatbot = await db.whatsAppChatbotConfig.findUnique({
    where: { organizationId: tenant.organizationId },
  });

  // Ensure rows exist so the setup UI is always editable
  if (!connection) {
    connection = await db.whatsAppConnection.create({
      data: { organizationId: tenant.organizationId },
    });
  }

  if (!chatbot) {
    chatbot = await db.whatsAppChatbotConfig.create({
      data: {
        organizationId: tenant.organizationId,
        connectionId: connection.id,
        greetingMessage: DEFAULT_GREETING,
        fallbackMessage: DEFAULT_FALLBACK,
      },
    });
  }

  const conversationCount = await db.whatsAppConversation.count({
    where: { organizationId: tenant.organizationId },
  });
  const openConversations = await db.whatsAppConversation.count({
    where: {
      organizationId: tenant.organizationId,
      status: { in: ["OPEN", "BOT", "HUMAN"] },
    },
  });

  return {
    tenant,
    connection: {
      id: connection.id,
      status: connection.status,
      displayPhoneNumber: connection.displayPhoneNumber,
      verifiedName: connection.verifiedName,
      phoneNumberId: connection.phoneNumberId,
      wabaId: connection.wabaId,
      hasAccessToken: Boolean(connection.accessTokenEnc),
      connectedAt: connection.connectedAt,
      lastWebhookAt: connection.lastWebhookAt,
      lastError: connection.lastError,
    },
    chatbot: {
      id: chatbot.id,
      mode: chatbot.mode,
      displayName: chatbot.displayName,
      greetingMessage: chatbot.greetingMessage,
      fallbackMessage: chatbot.fallbackMessage,
      language: chatbot.language,
      tone: chatbot.tone,
      canBrowseMenu: chatbot.canBrowseMenu,
      canTakeOrders: chatbot.canTakeOrders,
      canTrackOrders: chatbot.canTrackOrders,
      canAnswerFaq: chatbot.canAnswerFaq,
      allowDelivery: chatbot.allowDelivery,
      allowTakeaway: chatbot.allowTakeaway,
      allowDineIn: chatbot.allowDineIn,
      businessHoursEnabled: chatbot.businessHoursEnabled,
      offlineMessage: chatbot.offlineMessage,
      humanHandoffEnabled: chatbot.humanHandoffEnabled,
      handoffKeywords: chatbot.handoffKeywords,
      systemPromptExtra: chatbot.systemPromptExtra,
      maxReplyTokens: chatbot.maxReplyTokens,
    },
    stats: {
      conversationCount,
      openConversations,
    },
  };
}

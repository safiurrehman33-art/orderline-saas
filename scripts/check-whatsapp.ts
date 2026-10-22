import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { decryptSecret } from "../src/lib/crypto/secrets";
import { fetchPhoneNumberProfile } from "../src/lib/whatsapp/meta-graph";

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const connections = await db.whatsAppConnection.findMany({
      select: {
        id: true,
        status: true,
        phoneNumberId: true,
        wabaId: true,
        displayPhoneNumber: true,
        lastWebhookAt: true,
        lastError: true,
        connectedAt: true,
        accessTokenEnc: true,
      },
    });
    const bots = await db.whatsAppChatbotConfig.findMany({
      select: { mode: true, displayName: true, organizationId: true },
    });
    const conversations = await db.whatsAppConversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        customerWaId: true,
        customerPhone: true,
        status: true,
        lastMessageAt: true,
        unreadCount: true,
      },
    });
    const messages = await db.whatsAppMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        direction: true,
        role: true,
        body: true,
        status: true,
        createdAt: true,
        waMessageId: true,
      },
    });

    console.log(
      JSON.stringify(
        {
          connections: connections.map((c) => ({
            ...c,
            hasToken: Boolean(c.accessTokenEnc),
            accessTokenEnc: undefined,
          })),
          bots,
          conversations,
          messages,
          counts: {
            conversations: await db.whatsAppConversation.count(),
            messages: await db.whatsAppMessage.count(),
          },
        },
        null,
        2,
      ),
    );

    const conn = connections[0];
    if (conn?.accessTokenEnc && conn.phoneNumberId) {
      try {
        const token = decryptSecret(conn.accessTokenEnc);
        const profile = await fetchPhoneNumberProfile(
          conn.phoneNumberId,
          token,
        );
        console.log("token_ok", profile);
      } catch (error) {
        console.log(
          "token_fail",
          error instanceof Error ? error.message : error,
        );
      }
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

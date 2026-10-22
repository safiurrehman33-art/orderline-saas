import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { decryptSecret } from "../src/lib/crypto/secrets";
import { subscribeAppToWaba } from "../src/lib/whatsapp/meta-graph";

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    const conn = await db.whatsAppConnection.findFirst({
      where: { status: "CONNECTED" },
    });
    if (!conn?.accessTokenEnc || !conn.wabaId) {
      throw new Error("No connected WhatsApp account found.");
    }

    const token = decryptSecret(conn.accessTokenEnc);
    const sub = await subscribeAppToWaba(conn.wabaId, token);
    console.log("subscribe_result", sub);

    const bot = await db.whatsAppChatbotConfig.updateMany({
      where: { organizationId: conn.organizationId },
      data: { mode: "ACTIVE" },
    });
    console.log("bot_activated", bot);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

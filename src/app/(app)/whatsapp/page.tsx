import { PageHeader } from "@/components/ui/page-header";
import { WhatsAppSetup } from "@/components/whatsapp/whatsapp-setup";
import { getWhatsAppModuleData } from "@/lib/data/whatsapp";
import { can } from "@/lib/permissions";
import {
  getMetaWhatsAppPublicConfig,
  getMetaWhatsAppServerConfig,
  getWhatsAppAiConfig,
} from "@/lib/whatsapp/config";

export const metadata = { title: "WhatsApp Chatbot AI" };

export default async function WhatsAppChatbotPage() {
  const { tenant, connection, chatbot, stats } = await getWhatsAppModuleData();
  const canManage = can(tenant.role, "whatsapp:manage");
  const metaPublic = getMetaWhatsAppPublicConfig();
  const metaServer = getMetaWhatsAppServerConfig();
  const ai = getWhatsAppAiConfig();

  return (
    <div>
      <PageHeader
        title="WhatsApp Chatbot AI Automation"
        description="Real-time Meta WhatsApp + OpenAI agent. Customers message your business number; the AI understands intent, uses live menu tools, and replies on WhatsApp."
      />

      <WhatsAppSetup
        canManage={canManage}
        connection={connection}
        chatbot={chatbot}
        stats={stats}
        meta={metaPublic}
        webhookUrl={metaServer.webhookUrl}
        verifyTokenConfigured={Boolean(metaServer.verifyToken)}
        ai={{
          configured: ai.configured,
          model: ai.model,
          provider: ai.provider,
        }}
      />
    </div>
  );
}

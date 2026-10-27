/**
 * Meta WhatsApp Cloud API / Embedded Signup env.
 * Public keys are safe for the browser; secrets stay server-only.
 */
export function getMetaWhatsAppPublicConfig() {
  const appId =
    process.env.NEXT_PUBLIC_META_APP_ID?.trim() ||
    process.env.META_APP_ID?.trim() ||
    "";
  const configId =
    process.env.NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ||
    process.env.META_EMBEDDED_SIGNUP_CONFIG_ID?.trim() ||
    "";
  const graphVersion =
    process.env.NEXT_PUBLIC_META_GRAPH_API_VERSION?.trim() ||
    process.env.META_GRAPH_API_VERSION?.trim() ||
    "v21.0";

  return {
    appId,
    configId,
    graphVersion,
    embeddedSignupReady: Boolean(appId && configId),
  };
}

export function getMetaWhatsAppServerConfig() {
  const publicConfig = getMetaWhatsAppPublicConfig();
  const appSecret = process.env.META_APP_SECRET?.trim() || "";
  const verifyToken =
    process.env.META_WHATSAPP_VERIFY_TOKEN?.trim() ||
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() ||
    "";
  // Prefer a dedicated public HTTPS base for Meta webhooks (ngrok/domain).
  // Keep AUTH_URL as localhost during local login so NextAuth cookies don't loop.
  const appUrl = (
    process.env.WHATSAPP_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    ""
  ).replace(/\/$/, "");

  return {
    ...publicConfig,
    appSecret,
    verifyToken,
    appUrl,
    webhookUrl: appUrl ? `${appUrl}/api/whatsapp/webhook` : "",
    serverReady: Boolean(
      publicConfig.appId && appSecret && verifyToken,
    ),
    /** Full Embedded Signup needs config id + secret */
    embeddedSignupServerReady: Boolean(
      publicConfig.appId &&
        publicConfig.configId &&
        appSecret,
    ),
  };
}

export function getWhatsAppWebhookPath() {
  return "/api/whatsapp/webhook";
}

/** Real LLM used by the WhatsApp chatbot (Gemini or OpenAI tool-calling agent). */
export function getWhatsAppAiConfig() {
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  const openAiKey = process.env.OPENAI_API_KEY?.trim() || "";
  const forceLocal = process.env.WHATSAPP_AI_PROVIDER === "local";
  const prefer =
    process.env.WHATSAPP_AI_PROVIDER?.trim().toLowerCase() || "";

  const useGemini =
    !forceLocal &&
    Boolean(geminiKey) &&
    (prefer === "gemini" || prefer === "" || !openAiKey);
  const useOpenAi = !forceLocal && Boolean(openAiKey) && !useGemini;

  const model = useGemini
    ? process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash"
    : process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  return {
    configured: (useGemini || useOpenAi) && !forceLocal,
    provider: forceLocal
      ? "local"
      : useGemini
        ? "Gemini"
        : useOpenAi
          ? "OpenAI"
          : "none",
    model,
    forceLocal,
  };
}

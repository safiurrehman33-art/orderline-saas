import { db } from "@/lib/db";
import {
  AGENT_TOOL_DEFINITIONS,
  executeAgentTool,
} from "@/lib/whatsapp/agent/tools";
import type { AgentRunResult } from "@/lib/whatsapp/agent/types";

type ChatbotCaps = {
  displayName: string;
  greetingMessage: string;
  fallbackMessage: string;
  language: string;
  tone: string;
  systemPromptExtra: string | null;
  maxReplyTokens: number;
  canBrowseMenu: boolean;
  canTakeOrders: boolean;
  canTrackOrders: boolean;
  canAnswerFaq: boolean;
  allowDelivery: boolean;
  allowTakeaway: boolean;
  allowDineIn: boolean;
  humanHandoffEnabled: boolean;
  handoffKeywords: string[];
};

function buildSystemPrompt(
  orgName: string,
  caps: ChatbotCaps,
  menuDigest: string,
) {
  const tone =
    caps.tone === "professional"
      ? "professional and concise"
      : caps.tone === "casual"
        ? "casual and warm"
        : "friendly and helpful";

  return [
    `You are ${caps.displayName}, the WhatsApp AI ordering assistant for "${orgName}".`,
    `Speak in a ${tone} tone. Prefer short WhatsApp-friendly messages.`,
    `Language preference: ${caps.language}.`,
    "Understand the customer's intent from natural language and reply helpfully.",
    "Use tools for live menu, deals, cart, placing orders, and tracking. Never invent menu items or prices.",
    "Capabilities:",
    `- Browse menu/deals: ${caps.canBrowseMenu}`,
    `- Take orders: ${caps.canTakeOrders}`,
    `- Track orders: ${caps.canTrackOrders}`,
    `- FAQ: ${caps.canAnswerFaq}`,
    `- Allow takeaway: ${caps.allowTakeaway}`,
    `- Allow delivery: ${caps.allowDelivery}`,
    `- Allow dine-in: ${caps.allowDineIn}`,
    `- Human handoff: ${caps.humanHandoffEnabled}`,
    "When customer wants a human/agent/staff, call request_human_handoff.",
    "For orders: add items to cart, summarize, then place_order with confirm=true only after customer confirms.",
    menuDigest
      ? `Current menu snapshot (use tools for exact search/order):\n${menuDigest}`
      : "",
    caps.systemPromptExtra?.trim()
      ? `Owner training instructions (always follow):\n${caps.systemPromptExtra.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function runOpenAiAgent(input: {
  organizationId: string;
  conversationId: string;
  customerWaId: string;
  userMessage: string;
  orgName: string;
  caps: ChatbotCaps;
  menuDigest: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<AgentRunResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const toolTrace: AgentRunResult["toolTrace"] = [];
  let handoff = false;

  type OaiMessage = {
    role: string;
    content?: string | null;
    tool_calls?: Array<{
      id: string;
      type: string;
      function: { name: string; arguments: string };
    }>;
    tool_call_id?: string;
    name?: string;
  };

  const messages: OaiMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(input.orgName, input.caps, input.menuDigest),
    },
    ...input.history.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: input.userMessage },
  ];

  for (let round = 0; round < 6; round += 1) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: input.caps.maxReplyTokens || 800,
        messages,
        tools: AGENT_TOOL_DEFINITIONS,
        tool_choice: "auto",
      }),
    });

    const json = (await res.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: OaiMessage }>;
    };
    if (!res.ok) {
      throw new Error(json.error?.message || `OpenAI error ${res.status}`);
    }

    const message = json.choices?.[0]?.message;
    if (!message) throw new Error("OpenAI returned an empty response.");

    const toolCalls = message.tool_calls ?? [];
    if (!toolCalls.length) {
      return {
        reply:
          message.content?.trim() ||
          input.caps.fallbackMessage,
        toolTrace,
        handoff,
        provider: "openai",
      };
    }

    messages.push({
      role: "assistant",
      content: message.content ?? null,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}") as Record<
          string,
          unknown
        >;
      } catch {
        args = {};
      }
      const result = await executeAgentTool({
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        customerWaId: input.customerWaId,
        name: call.function.name,
        args,
        capabilities: input.caps,
      });
      toolTrace.push({ name: call.function.name, args, result });
      if (
        call.function.name === "request_human_handoff" &&
        result &&
        typeof result === "object" &&
        "handoff" in result &&
        (result as { handoff?: boolean }).handoff
      ) {
        handoff = true;
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: input.caps.fallbackMessage,
    toolTrace,
    handoff,
    provider: "openai",
  };
}

async function runLocalAgent(input: {
  organizationId: string;
  conversationId: string;
  customerWaId: string;
  userMessage: string;
  orgName: string;
  caps: ChatbotCaps;
}): Promise<AgentRunResult> {
  const text = input.userMessage.trim();
  const lower = text.toLowerCase();
  const toolTrace: AgentRunResult["toolTrace"] = [];
  const caps = input.caps;

  const runTool = async (name: string, args: Record<string, unknown> = {}) => {
    const result = await executeAgentTool({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      customerWaId: input.customerWaId,
      name,
      args,
      capabilities: caps,
    });
    toolTrace.push({ name, args, result });
    return result;
  };

  // Handoff keywords
  if (
    caps.humanHandoffEnabled &&
    caps.handoffKeywords.some((k) => lower.includes(k.toLowerCase()))
  ) {
    await runTool("request_human_handoff", { reason: "keyword" });
    return {
      reply:
        "Got it — I’m connecting you with our team. Someone will continue this chat shortly.",
      toolTrace,
      handoff: true,
      provider: "local",
    };
  }

  // Confirm order
  if (
    /^(yes|yep|yeah|confirm|ok|okay|place it|place order|order now)\b/i.test(
      lower,
    )
  ) {
    const preview = await runTool("place_order", { confirm: false });
    if (
      preview &&
      typeof preview === "object" &&
      "needsConfirmation" in preview
    ) {
      const placed = await runTool("place_order", {
        confirm: true,
        orderType: "TAKEAWAY",
      });
      if (placed && typeof placed === "object" && "ok" in placed) {
        const p = placed as {
          orderNumber: string;
          total: string;
          status: string;
        };
        return {
          reply: `✅ Order placed!\n${p.orderNumber}\nTotal: ${p.total}\nStatus: ${p.status}\nWe’ll start preparing it now.`,
          toolTrace,
          handoff: false,
          provider: "local",
        };
      }
    }
  }

  // Track
  if (caps.canTrackOrders && /(track|status|where.*order|my order)/i.test(lower)) {
    const orderMatch = text.match(/ORD-\d{4}-\d+/i);
    const tracked = await runTool("track_order", {
      ...(orderMatch ? { orderNumber: orderMatch[0] } : {}),
    });
    if (tracked && typeof tracked === "object" && "orderNumber" in tracked) {
      const t = tracked as {
        orderNumber: string;
        status: string;
        total: string;
        items: string[];
      };
      return {
        reply: `Order ${t.orderNumber}\nStatus: ${t.status}\nTotal: ${t.total}\nItems: ${t.items.join(", ")}`,
        toolTrace,
        handoff: false,
        provider: "local",
      };
    }
    return {
      reply: "I couldn’t find a recent order for you. Share your order number (e.g. ORD-2026-00012).",
      toolTrace,
      handoff: false,
      provider: "local",
    };
  }

  // Deals
  if (caps.canBrowseMenu && /(deal|offers|combo|promotion)/i.test(lower)) {
    const deals = await runTool("get_deals");
    const list =
      deals && typeof deals === "object" && "deals" in deals
        ? (
            deals as {
              deals: Array<{ name: string; price: string; includes: string[] }>;
            }
          ).deals
        : [];
    if (!list.length) {
      return {
        reply: "No active deals right now. Ask me for the menu anytime.",
        toolTrace,
        handoff: false,
        provider: "local",
      };
    }
    return {
      reply:
        "🔥 Current deals:\n" +
        list
          .slice(0, 8)
          .map(
            (d) =>
              `• ${d.name} — ${d.price}\n  (${d.includes.join(", ")})`,
          )
          .join("\n"),
      toolTrace,
      handoff: false,
      provider: "local",
    };
  }

  // Cart
  if (/(cart|basket|my items)/i.test(lower)) {
    const cart = await runTool("view_cart");
    const c = cart as {
      items: Array<{ name: string; quantity: number; lineTotal: string }>;
      subtotal: string;
    };
    if (!c.items?.length) {
      return {
        reply: "Your cart is empty. Tell me an item to add (e.g. “2 burgers”).",
        toolTrace,
        handoff: false,
        provider: "local",
      };
    }
    return {
      reply:
        "🛒 Your cart:\n" +
        c.items.map((i) => `• ${i.quantity}x ${i.name} — ${i.lineTotal}`).join("\n") +
        `\nSubtotal: ${c.subtotal}\nReply *confirm* to place the order.`,
      toolTrace,
      handoff: false,
      provider: "local",
    };
  }

  // Add to cart patterns: "2x burger", "add fries", "I want pizza"
  if (caps.canTakeOrders) {
    const qtyMatch = lower.match(/(\d+)\s*(x|pcs|pieces)?\s+(.+)/i);
    const addMatch = lower.match(
      /(?:add|want|order|get|give me)\s+(\d+)?\s*(.*)/i,
    );
    let quantity = 1;
    let nameQuery = "";
    if (qtyMatch) {
      quantity = Number(qtyMatch[1]) || 1;
      nameQuery = qtyMatch[3];
    } else if (addMatch) {
      quantity = Number(addMatch[1] || 1) || 1;
      nameQuery = addMatch[2];
    }

    nameQuery = nameQuery
      .replace(/\b(please|thanks|thank you|to cart|for me)\b/gi, "")
      .trim();

    if (
      nameQuery &&
      !/(menu|deal|track|status|hello|hi|hey|help)/i.test(nameQuery)
    ) {
      const added = await runTool("add_to_cart", {
        productName: nameQuery,
        quantity,
      });
      if (added && typeof added === "object" && "ok" in added) {
        const a = added as {
          added: { name: string; quantity: number };
          subtotal: string;
        };
        return {
          reply: `Added ${a.added.quantity}x ${a.added.name}.\nCart subtotal: ${a.subtotal}\nSay *cart* to review or *confirm* to place order.`,
          toolTrace,
          handoff: false,
          provider: "local",
        };
      }
    }
  }

  // Menu
  if (
    caps.canBrowseMenu &&
    /(menu|price|what do you have|items|food|list)/i.test(lower)
  ) {
    const query =
      lower.replace(/menu|price|list|please|show|the|what|do|you|have|items|food/gi, "").trim() ||
      undefined;
    const menu = await runTool("get_menu", { query, limit: 10 });
    const items =
      menu && typeof menu === "object" && "items" in menu
        ? (
            menu as {
              items: Array<{ name: string; price: string; category: string | null }>;
            }
          ).items
        : [];
    if (!items.length) {
      return {
        reply: caps.fallbackMessage,
        toolTrace,
        handoff: false,
        provider: "local",
      };
    }
    return {
      reply:
        `📋 ${input.orgName} menu:\n` +
        items
          .map(
            (i) =>
              `• ${i.name} — ${i.price}${i.category ? ` (${i.category})` : ""}`,
          )
          .join("\n") +
        `\n\nReply like: "2 burgers" to add to cart.`,
      toolTrace,
      handoff: false,
      provider: "local",
    };
  }

  // Greeting-ish
  if (/^(hi|hello|hey|salam|assalam|good morning|good evening)\b/i.test(lower)) {
    return {
      reply: caps.greetingMessage,
      toolTrace,
      handoff: false,
      provider: "local",
    };
  }

  // Helpful default: try menu search with whole message
  if (caps.canBrowseMenu) {
    const menu = await runTool("get_menu", { query: text, limit: 5 });
    const items =
      menu && typeof menu === "object" && "items" in menu
        ? (
            menu as {
              items: Array<{ name: string; price: string }>;
            }
          ).items
        : [];
    if (items.length === 1 && caps.canTakeOrders) {
      const added = await runTool("add_to_cart", {
        productName: items[0].name,
        quantity: 1,
      });
      if (added && typeof added === "object" && "ok" in added) {
        return {
          reply: `Found *${items[0].name}* (${items[0].price}) and added 1 to your cart.\nSay *confirm* to order or *menu* for more.`,
          toolTrace,
          handoff: false,
          provider: "local",
        };
      }
    }
    if (items.length > 1) {
      return {
        reply:
          "I found these:\n" +
          items.map((i) => `• ${i.name} — ${i.price}`).join("\n") +
          `\nReply with the item name to add it.`,
        toolTrace,
        handoff: false,
        provider: "local",
      };
    }
  }

  return {
    reply: caps.fallbackMessage,
    toolTrace,
    handoff: false,
    provider: "local",
  };
}

export async function runWhatsAppAgent(input: {
  organizationId: string;
  conversationId: string;
  customerWaId: string;
  userMessage: string;
}): Promise<AgentRunResult> {
  const [org, caps, historyRows, products, deals] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
      select: { name: true },
    }),
    db.whatsAppChatbotConfig.findUniqueOrThrow({
      where: { organizationId: input.organizationId },
    }),
    db.whatsAppMessage.findMany({
      where: {
        conversationId: input.conversationId,
        body: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 16,
      select: { role: true, body: true },
    }),
    db.product.findMany({
      where: {
        organizationId: input.organizationId,
        active: true,
        archivedAt: null,
      },
      take: 40,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, priceCents: true, sku: true },
    }),
    db.deal.findMany({
      where: { organizationId: input.organizationId, active: true },
      take: 15,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, priceCents: true },
    }),
  ]);

  const history = historyRows
    .reverse()
    .filter((m) => m.body)
    .map((m) => ({
      role:
        m.role === "CUSTOMER"
          ? ("user" as const)
          : ("assistant" as const),
      content: m.body!,
    }));

  const chatbotCaps: ChatbotCaps = {
    displayName: caps.displayName,
    greetingMessage: caps.greetingMessage,
    fallbackMessage: caps.fallbackMessage,
    language: caps.language,
    tone: caps.tone,
    systemPromptExtra: caps.systemPromptExtra,
    maxReplyTokens: caps.maxReplyTokens,
    canBrowseMenu: caps.canBrowseMenu,
    canTakeOrders: caps.canTakeOrders,
    canTrackOrders: caps.canTrackOrders,
    canAnswerFaq: caps.canAnswerFaq,
    allowDelivery: caps.allowDelivery,
    allowTakeaway: caps.allowTakeaway,
    allowDineIn: caps.allowDineIn,
    humanHandoffEnabled: caps.humanHandoffEnabled,
    handoffKeywords: caps.handoffKeywords,
  };

  const menuDigest = [
    products.length
      ? `Products: ${products
          .map((p) => `${p.name} (${(p.priceCents / 100).toFixed(2)})`)
          .join("; ")}`
      : "",
    deals.length
      ? `Deals: ${deals
          .map((d) => `${d.name} (${(d.priceCents / 100).toFixed(2)})`)
          .join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const forceLocal = process.env.WHATSAPP_AI_PROVIDER === "local";
  if (!forceLocal) {
    try {
      const openAi = await runOpenAiAgent({
        ...input,
        orgName: org.name,
        caps: chatbotCaps,
        menuDigest,
        history,
      });
      if (openAi) return openAi;

      // No API key configured
      return {
        reply:
          "Thanks for your message. Our AI assistant is not configured yet. Please contact the restaurant directly, or try again later.",
        toolTrace: [],
        handoff: false,
        provider: "openai",
      };
    } catch (error) {
      console.error(
        "[whatsapp.agent] OpenAI failed:",
        error instanceof Error ? error.message : error,
      );
      return {
        reply:
          caps.fallbackMessage ||
          "Sorry — I’m having trouble right now. Please try again in a moment.",
        toolTrace: [],
        handoff: false,
        provider: "openai",
      };
    }
  }

  // Explicit local mode only (not used in normal production)
  return runLocalAgent({
    ...input,
    orgName: org.name,
    caps: chatbotCaps,
  });
}

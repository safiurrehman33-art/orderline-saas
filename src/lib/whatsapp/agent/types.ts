export type AgentChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
};

export type AgentToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AgentRunResult = {
  reply: string;
  toolTrace: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }>;
  handoff: boolean;
  provider: "openai" | "local";
};

export type ConversationCartItem = {
  productId: string;
  name: string;
  sku: string;
  unitCents: number;
  quantity: number;
};

export type ConversationAgentState = {
  cart?: ConversationCartItem[];
  orderType?: "TAKEAWAY" | "DELIVERY" | "DINE_IN";
  awaiting?: "confirm_order" | null;
  deliveryAddress?: string | null;
  customerName?: string | null;
};

import type { OrderType, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { computeOrderTotals, pricingFromOrg } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import type {
  ConversationAgentState,
  ConversationCartItem,
} from "@/lib/whatsapp/agent/types";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export const AGENT_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "get_menu",
      description:
        "Browse live restaurant menu products. Use for menu questions, prices, availability.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional search text for product name",
          },
          limit: { type: "number", description: "Max items (default 12)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_deals",
      description: "List active combo deals and their prices.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "view_cart",
      description: "Show the customer's current WhatsApp cart.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description:
        "Add a menu item to cart by product name or productId. Creates/updates cart quantity.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          productName: { type: "string" },
          quantity: { type: "number" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "clear_cart",
      description: "Empty the WhatsApp cart.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "place_order",
      description:
        "Place a real kitchen order from the current cart. Prefer TAKEAWAY unless customer asks delivery.",
      parameters: {
        type: "object",
        properties: {
          orderType: {
            type: "string",
            enum: ["TAKEAWAY", "DELIVERY", "DINE_IN"],
          },
          notes: { type: "string" },
          customerName: { type: "string" },
          deliveryAddress: { type: "string" },
          confirm: {
            type: "boolean",
            description: "Must be true to actually place the order",
          },
        },
        required: ["confirm"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "track_order",
      description: "Track recent order status by order number or latest order for this customer.",
      parameters: {
        type: "object",
        properties: {
          orderNumber: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "request_human_handoff",
      description: "Pause the bot and hand the chat to human staff.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string" },
        },
      },
    },
  },
];

function asState(raw: unknown): ConversationAgentState {
  if (!raw || typeof raw !== "object") return {};
  return raw as ConversationAgentState;
}

async function saveState(conversationId: string, state: ConversationAgentState) {
  await db.whatsAppConversation.update({
    where: { id: conversationId },
    data: { metadata: asJson(state) },
  });
}

async function nextOrderNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const latest = await db.order.findFirst({
    where: { organizationId, orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const lastSeq = latest
    ? Number.parseInt(latest.orderNumber.replace(prefix, ""), 10)
    : 0;
  const next = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

function cartTotals(cart: ConversationCartItem[]) {
  const subtotalCents = cart.reduce(
    (sum, item) => sum + item.unitCents * item.quantity,
    0,
  );
  return { subtotalCents, lines: cart.length };
}

export async function executeAgentTool(input: {
  organizationId: string;
  conversationId: string;
  customerWaId: string;
  name: string;
  args: Record<string, unknown>;
  capabilities: {
    canBrowseMenu: boolean;
    canTakeOrders: boolean;
    canTrackOrders: boolean;
    canAnswerFaq: boolean;
    allowDelivery: boolean;
    allowTakeaway: boolean;
    allowDineIn: boolean;
    humanHandoffEnabled: boolean;
  };
}) {
  const conversation = await db.whatsAppConversation.findUniqueOrThrow({
    where: { id: input.conversationId },
  });
  const state = asState(conversation.metadata);
  const cart = [...(state.cart ?? [])];

  switch (input.name) {
    case "get_menu": {
      if (!input.capabilities.canBrowseMenu) {
        return { error: "Menu browsing is disabled." };
      }
      const query = String(input.args.query ?? "").trim();
      const limit = Math.min(20, Math.max(1, Number(input.args.limit ?? 12) || 12));
      const products = await db.product.findMany({
        where: {
          organizationId: input.organizationId,
          active: true,
          archivedAt: null,
          ...(query
            ? { name: { contains: query, mode: "insensitive" as const } }
            : {}),
        },
        take: limit,
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { category: { select: { name: true } } },
      });
      return {
        count: products.length,
        items: products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: formatMoney(p.priceCents),
          priceCents: p.priceCents,
          category: p.category?.name ?? null,
        })),
      };
    }

    case "get_deals": {
      if (!input.capabilities.canBrowseMenu) {
        return { error: "Deals browsing is disabled." };
      }
      const deals = await db.deal.findMany({
        where: { organizationId: input.organizationId, active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: 15,
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
        },
      });
      return {
        count: deals.length,
        deals: deals.map((d) => ({
          id: d.id,
          name: d.name,
          price: formatMoney(d.priceCents),
          includes: d.items.map(
            (i) => `${i.quantity}x ${i.product.name}`,
          ),
        })),
      };
    }

    case "view_cart": {
      const { subtotalCents } = cartTotals(cart);
      return {
        items: cart.map((i) => ({
          ...i,
          lineTotal: formatMoney(i.unitCents * i.quantity),
        })),
        subtotal: formatMoney(subtotalCents),
        subtotalCents,
        orderType: state.orderType ?? null,
      };
    }

    case "add_to_cart": {
      if (!input.capabilities.canTakeOrders) {
        return { error: "Ordering is disabled." };
      }
      const quantity = Math.max(1, Math.min(50, Number(input.args.quantity ?? 1) || 1));
      const productId = String(input.args.productId ?? "").trim();
      const productName = String(input.args.productName ?? "").trim();

      const product = productId
        ? await db.product.findFirst({
            where: {
              id: productId,
              organizationId: input.organizationId,
              active: true,
              archivedAt: null,
            },
          })
        : await db.product.findFirst({
            where: {
              organizationId: input.organizationId,
              active: true,
              archivedAt: null,
              name: { contains: productName, mode: "insensitive" },
            },
          });

      if (!product) {
        return {
          error: "Product not found. Ask customer to choose from the menu.",
        };
      }

      const existing = cart.find((c) => c.productId === product.id);
      if (existing) existing.quantity += quantity;
      else {
        cart.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitCents: product.priceCents,
          quantity,
        });
      }

      const nextState = { ...state, cart, awaiting: null };
      await saveState(input.conversationId, nextState);
      const { subtotalCents } = cartTotals(cart);
      return {
        ok: true,
        added: { name: product.name, quantity },
        cartCount: cart.length,
        subtotal: formatMoney(subtotalCents),
      };
    }

    case "clear_cart": {
      const nextState = { ...state, cart: [], awaiting: null };
      await saveState(input.conversationId, nextState);
      return { ok: true, cart: [] };
    }

    case "place_order": {
      if (!input.capabilities.canTakeOrders) {
        return { error: "Ordering is disabled." };
      }
      if (!cart.length) {
        return { error: "Cart is empty. Add items first." };
      }

      const confirm = Boolean(input.args.confirm);
      let orderType = String(input.args.orderType ?? state.orderType ?? "TAKEAWAY")
        .toUpperCase() as OrderType;
      if (!["TAKEAWAY", "DELIVERY", "DINE_IN"].includes(orderType)) {
        orderType = "TAKEAWAY";
      }
      if (orderType === "DELIVERY" && !input.capabilities.allowDelivery) {
        return { error: "Delivery is not enabled." };
      }
      if (orderType === "TAKEAWAY" && !input.capabilities.allowTakeaway) {
        return { error: "Takeaway is not enabled." };
      }
      if (orderType === "DINE_IN" && !input.capabilities.allowDineIn) {
        return { error: "Dine-in via WhatsApp is not enabled." };
      }

      const deliveryAddress =
        String(input.args.deliveryAddress ?? state.deliveryAddress ?? "").trim() ||
        null;
      const customerName =
        String(input.args.customerName ?? state.customerName ?? "").trim() ||
        null;
      const notes = String(input.args.notes ?? "").trim() || null;

      if (!confirm) {
        const { subtotalCents } = cartTotals(cart);
        await saveState(input.conversationId, {
          ...state,
          cart,
          orderType,
          deliveryAddress,
          customerName,
          awaiting: "confirm_order",
        });
        return {
          needsConfirmation: true,
          orderType,
          items: cart,
          subtotal: formatMoney(subtotalCents),
          message:
            "Ask the customer to confirm. Call place_order again with confirm=true.",
        };
      }

      if (orderType === "DELIVERY" && !deliveryAddress) {
        return { error: "Delivery address is required." };
      }

      const org = await db.organization.findUniqueOrThrow({
        where: { id: input.organizationId },
        select: {
          taxEnabled: true,
          salesTaxPercent: true,
          vatPercent: true,
          serviceChargePercent: true,
          pricesIncludeTax: true,
        },
      });
      const pricing = pricingFromOrg(org);
      const subtotalCents = cart.reduce(
        (sum, i) => sum + i.unitCents * i.quantity,
        0,
      );
      const totals = computeOrderTotals(subtotalCents, pricing);
      const orderNumber = await nextOrderNumber(input.organizationId);
      const now = new Date();

      let customerId: string | null = null;
      const phone = conversation.customerPhone || input.customerWaId;
      if (phone) {
        const existingCustomer = await db.customer.findFirst({
          where: {
            organizationId: input.organizationId,
            phone: { contains: phone.replace(/\D/g, "").slice(-10) },
            archivedAt: null,
          },
        });
        if (existingCustomer) {
          customerId = existingCustomer.id;
          if (deliveryAddress || customerName) {
            await db.customer.update({
              where: { id: existingCustomer.id },
              data: {
                ...(customerName ? { name: customerName } : {}),
                ...(deliveryAddress
                  ? { addressLine1: deliveryAddress }
                  : {}),
              },
            });
          }
        } else {
          const created = await db.customer.create({
            data: {
              organizationId: input.organizationId,
              name: customerName || conversation.customerName || `WhatsApp ${phone}`,
              phone,
              addressLine1: deliveryAddress,
              tags: ["whatsapp"],
            },
          });
          customerId = created.id;
          await db.whatsAppConversation.update({
            where: { id: input.conversationId },
            data: { customerId },
          });
        }
      }

      const order = await db.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            organizationId: input.organizationId,
            orderNumber,
            status: "PENDING",
            orderType,
            guestCount: 1,
            notes: notes
              ? `WhatsApp order · ${notes}`
              : "WhatsApp chatbot order",
            subtotalCents: totals.subtotalCents,
            salesTaxCents: totals.salesTaxCents,
            vatCents: totals.vatCents,
            serviceCents: totals.serviceCents,
            taxCents: totals.taxCents,
            totalCents: totals.totalCents,
            placedAt: now,
            customerId,
            items: {
              create: cart.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCents: item.unitCents,
                totalCents: item.unitCents * item.quantity,
                productName: item.name,
                productSku: item.sku,
              })),
            },
            statusEvents: {
              create: {
                toStatus: "PENDING",
                note: "Placed via WhatsApp AI chatbot",
                createdBy: "whatsapp-agent",
              },
            },
          },
        });
        return created;
      });

      await saveState(input.conversationId, {
        cart: [],
        awaiting: null,
        orderType,
        deliveryAddress,
        customerName,
      });

      return {
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: formatMoney(order.totalCents),
        status: order.status,
        orderType,
      };
    }

    case "track_order": {
      if (!input.capabilities.canTrackOrders) {
        return { error: "Order tracking is disabled." };
      }
      const orderNumber = String(input.args.orderNumber ?? "").trim();
      const order = orderNumber
        ? await db.order.findFirst({
            where: {
              organizationId: input.organizationId,
              orderNumber: { equals: orderNumber, mode: "insensitive" },
            },
            include: { items: true },
          })
        : await db.order.findFirst({
            where: {
              organizationId: input.organizationId,
              OR: [
                { customerId: conversation.customerId ?? undefined },
                {
                  notes: { contains: "WhatsApp", mode: "insensitive" },
                },
              ],
            },
            orderBy: { createdAt: "desc" },
            include: { items: true },
          });

      if (!order) return { error: "No order found." };
      return {
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: order.orderType,
        total: formatMoney(order.totalCents),
        items: order.items.map((i) => `${i.quantity}x ${i.productName}`),
        placedAt: order.placedAt,
      };
    }

    case "request_human_handoff": {
      if (!input.capabilities.humanHandoffEnabled) {
        return { error: "Human handoff is disabled." };
      }
      await db.whatsAppConversation.update({
        where: { id: input.conversationId },
        data: {
          status: "HUMAN",
          botPaused: true,
          metadata: asJson({
            ...state,
            handoffReason: String(input.args.reason ?? "customer_request"),
            handedOffAt: new Date().toISOString(),
          }),
        },
      });
      return {
        ok: true,
        handoff: true,
        message: "A team member will continue this chat.",
      };
    }

    default:
      return { error: `Unknown tool: ${input.name}` };
  }
}

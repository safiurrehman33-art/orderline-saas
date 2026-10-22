import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99999),
});

export const orderSchema = z.object({
  customerId: z.union([z.string().min(1), z.literal("")]).optional(),
  notes: z.string().max(5000).optional(),
  items: z.array(orderItemSchema).min(1, "Add at least one line item"),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "PENDING",
    "CONFIRMED",
    "READY",
    "FULFILLED",
    "CANCELLED",
  ]),
  note: z.string().max(500).optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

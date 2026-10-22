import { z } from "zod";

export const dealSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  price: z.string().min(1, "Deal price is required"),
  compareAt: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
  itemsJson: z.string().min(2, "Add at least one included product"),
});

export type DealInput = z.infer<typeof dealSchema>;

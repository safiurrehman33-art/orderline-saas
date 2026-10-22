import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/, "SKU can only include letters, numbers, . _ -"),
  description: z.string().max(5000).optional(),
  categoryId: z.union([z.string().min(1), z.literal("")]).optional(),
  imageUrl: z.string().max(500).optional(),
  price: z.string().min(1, "Price is required"),
  cost: z.string().optional(),
  currency: z.string().length(3).default("USD"),
  stockQty: z.coerce.number().int().min(0).default(0),
  trackStock: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

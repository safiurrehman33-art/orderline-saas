import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().max(40).optional(),
  company: z.string().max(120).optional(),
  addressLine1: z.string().max(160).optional(),
  addressLine2: z.string().max(160).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  postalCode: z.string().max(32).optional(),
  country: z.string().max(80).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.string().max(500).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export function parseTags(value?: string | null) {
  if (!value?.trim()) return [] as string[];
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  ];
}

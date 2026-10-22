import { z } from "zod";

export const tableSchema = z.object({
  name: z.string().min(1).max(80),
  code: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9_-]+$/, "Code can only include letters, numbers, _ -"),
  seats: z.coerce.number().int().min(1).max(50),
  section: z.string().max(80).optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]).default("AVAILABLE"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type TableInput = z.infer<typeof tableSchema>;

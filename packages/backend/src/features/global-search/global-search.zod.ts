import { z } from "zod";

export const globalSearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;

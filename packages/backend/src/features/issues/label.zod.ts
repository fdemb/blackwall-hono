import { z } from "zod";

export const createLabelSchema = z.object({
    name: z.string().min(1).max(50),
});

export type CreateLabel = z.infer<typeof createLabelSchema>;

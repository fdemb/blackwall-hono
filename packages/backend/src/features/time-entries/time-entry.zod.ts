import { z } from "zod";

export const createTimeEntrySchema = z.object({
    duration: z.number().int().positive(),
    description: z.string().optional(),
});

export type CreateTimeEntry = z.infer<typeof createTimeEntrySchema>;

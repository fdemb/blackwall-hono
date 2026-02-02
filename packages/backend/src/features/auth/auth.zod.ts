import { z } from "zod";

export const signupEmailSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2).max(50),
    password: z.string().min(8),
    workspaceDisplayName: z.string().min(2).max(50),
    workspaceUrlSlug: z
        .string()
        .min(2)
        .max(50)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export type SignupEmail = z.infer<typeof signupEmailSchema>;

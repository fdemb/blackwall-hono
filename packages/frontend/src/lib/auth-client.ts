import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@blackwall/backend/src/features/auth/better-auth";

const baseUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export const authClient = createAuthClient({
  baseURL: baseUrl,
  basePath: "/api/better-auth",
  plugins: [inferAdditionalFields<typeof auth>()],
});

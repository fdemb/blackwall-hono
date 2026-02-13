import { env } from "../../lib/zod-env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@blackwall/database";

const hashOptions = {
  algorithm: "argon2id" as const,
  memoryCost: env.ARGON2_MEMORY_COST,
  timeCost: env.ARGON2_TIME_COST,
};

async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, hashOptions);
}

async function verifyPassword(data: { password: string; hash: string }): Promise<boolean> {
  return Bun.password.verify(data.password, data.hash);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  basePath: "/api/better-auth",
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  socialProviders: {
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
  baseURL: env.APP_BASE_URL,
  secret: env.APP_SECRET,
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    additionalFields: {
      lastWorkspaceId: {
        type: "string",
        fieldName: "lastWorkspaceId",
        input: false,
      },
      lastTeamId: {
        type: "string",
        fieldName: "lastTeamId",
        input: false,
      },
      preferredTheme: {
        type: "string",
        fieldName: "preferredTheme",
        input: false,
      },
      preferredLocale: {
        type: "string",
        fieldName: "preferredLocale",
        input: false,
      },
    },
  },
});

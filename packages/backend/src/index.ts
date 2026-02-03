import { Hono } from "hono";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import { openAPIRouteHandler } from "hono-openapi";
import { betterAuthRoutes } from "./features/auth/better-auth.routes";
import { env } from "./lib/zod-env";
import { workspaceRoutes } from "./features/workspaces/workspace.routes";
import { teamRoutes } from "./features/teams/team.routes";
import { issueRoutes } from "./features/issues/issue.routes";
import { commentRoutes } from "./features/issues/comment.routes";
import {
  attachmentRoutes,
  attachmentDownloadRoutes,
} from "./features/issues/attachment.routes";
import { labelRoutes } from "./features/issues/label.routes";
import { issuePlanRoutes } from "./features/issue-plans/issue-plan.routes";
import { timeEntryRoutes } from "./features/time-entries/time-entry.routes";
import { globalSearchRoutes } from "./features/global-search/global-search.routes";
import { settingsRoutes } from "./features/settings/settings.routes";
import {
  invitationRoutes,
  publicInvitationRoutes,
  protectedInvitationRoutes,
} from "./features/invitations/invitation.routes";
import type { AppEnv } from "./lib/hono-env";
import { authRoutes } from "./features/auth/auth.routes";
import { errorHandler } from "./lib/error-handler";

const app = new Hono<AppEnv>()
  .use(
    "*",
    cors({
      origin: env.APP_BASE_URL,
      allowHeaders: ["Content-Type", "Authorization", "x-blackwall-workspace-slug"],
      allowMethods: ["POST", "GET", "OPTIONS", "DELETE", "PATCH"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    }),
  )
  .onError(errorHandler)
  // Public routes
  .route("/api/auth", betterAuthRoutes)
  .route("/auth", authRoutes)
  .route("/invitations", publicInvitationRoutes)
  // Protected routes (auth middleware inside each)
  .route("/workspaces", workspaceRoutes)
  .route("/invitations", protectedInvitationRoutes)
  // Protected per-workspace routes (auth + workspace middleware inside each)
  .route("/teams", teamRoutes)
  .route("/issues", issueRoutes)
  .route("/issues", commentRoutes)
  .route("/issues", attachmentRoutes)
  .route("/issues", attachmentDownloadRoutes)
  .route("/labels", labelRoutes)
  .route("/issue-plans", issuePlanRoutes)
  .route("/time-entries", timeEntryRoutes)
  .route("/search", globalSearchRoutes)
  .route("/invitations", invitationRoutes)
  .route("/settings", settingsRoutes);

// OpenAPI docs (public) - added after app is defined
app.get(
  "/api/docs/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Blackwall API",
        version: "1.0.0",
        description: "API documentation for the Blackwall backend",
      },
      servers: [{ url: "http://localhost:8000", description: "Local development" }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "better-auth.session_token",
            description: "Session cookie authentication",
          },
        },
      },
    },
  }),
);
app.get("/api/docs", Scalar({ url: "/api/docs/openapi" }));

export type AppType = typeof app;
export { app };

export default {
  port: 8000,
  fetch: app.fetch,
};

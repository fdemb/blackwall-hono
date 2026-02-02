import { Hono } from "hono";
import { cors } from "hono/cors";
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
import { jobRoutes } from "./features/jobs/job.routes";
import { globalSearchRoutes } from "./features/global-search/global-search.routes";
import { settingsRoutes } from "./features/settings/settings.routes";
import {
  invitationRoutes,
  publicInvitationRoutes,
  protectedInvitationRoutes,
} from "./features/invitations/invitation.routes";
import { authMiddleware } from "./features/auth/auth-middleware";
import type { AppEnv } from "./lib/hono-env";
import { authRoutes } from "./features/auth/auth.routes";
import { workspaceMiddleware } from "./features/workspaces/workspace-middleware";
import { errorHandler } from "./lib/error-handler";
import { logger } from "hono/logger";

const corsMiddleware = cors({
  origin: env.APP_BASE_URL,
  allowHeaders: ["Content-Type", "Authorization", "x-blackwall-workspace-slug"],
  allowMethods: ["POST", "GET", "OPTIONS", "DELETE", "PATCH"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
});

const publicApp = new Hono()
  .use("*", corsMiddleware)
  .route("/api/auth", betterAuthRoutes)
  .route("/auth", authRoutes)
  .route("/invitations", publicInvitationRoutes);

const protectedApp = new Hono<AppEnv>()
  .use("*", corsMiddleware)
  .use("*", authMiddleware)
  .route("/workspaces", workspaceRoutes)
  .route("/jobs", jobRoutes)
  .route("/invitations", protectedInvitationRoutes);

const protectedPerWorkspaceApp = new Hono<AppEnv>()
  .use("*", corsMiddleware)
  .use("*", authMiddleware)
  .use("*", workspaceMiddleware)
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

const app = new Hono()
  .onError(errorHandler)
  .route("/", publicApp)
  .route("/", protectedApp)
  .route("/", protectedPerWorkspaceApp);

export type AppType = typeof app;
export { app };

export default {
  port: 8000,
  fetch: app.fetch,
};

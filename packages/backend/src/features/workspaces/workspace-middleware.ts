import { createMiddleware } from "hono/factory";
import { workspaceService } from "./workspace.service";

export const workspaceMiddleware = createMiddleware(async (c, next) => {
  const workspaceSlug = c.req.header("x-blackwall-workspace-slug");
  if (!workspaceSlug) {
    return c.json({ error: "Workspace slug not provided" }, 400);
  }

  const workspace = await workspaceService.getWorkspaceBySlug(workspaceSlug);
  c.set("workspace", workspace);

  await next();
});

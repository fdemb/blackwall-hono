import { zValidator } from "../../lib/validator";
import { Hono } from "hono";
import type { AppEnv } from "../../lib/hono-env";
import { globalSearchService } from "./global-search.service";
import { globalSearchQuerySchema } from "./global-search.zod";

const globalSearchRoutes = new Hono<AppEnv>().get(
  "/",
  zValidator("query", globalSearchQuerySchema),
  async (c) => {
    const workspace = c.get("workspace");
    const user = c.get("user")!;
    const { q } = c.req.valid("query");

    const results = await globalSearchService.search({
      searchTerm: q,
      workspaceId: workspace.id,
      userId: user.id,
    });

    return c.json(results);
  },
);

export { globalSearchRoutes };

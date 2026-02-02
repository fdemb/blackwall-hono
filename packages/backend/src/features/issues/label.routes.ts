import { Hono } from "hono";
import { zValidator } from "../../lib/validator";
import { labelService } from "./label.service";
import type { AppEnv } from "../../lib/hono-env";
import { createLabelSchema } from "./label.zod";
import { HTTPException } from "hono/http-exception";

const labelRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const workspace = c.get("workspace");
    const labels = await labelService.getLabelsForWorkspace({
      workspaceId: workspace.id,
    });

    return c.json({ labels });
  })
  .get("/:labelId", async (c) => {
    const workspace = c.get("workspace");
    const { labelId } = c.req.param();

    const label = await labelService.getLabelById({
      labelId,
      workspaceId: workspace.id,
    });

    if (!label) {
      throw new HTTPException(404, { message: "Label not found" });
    }

    return c.json({ label });
  })
  .post("/", zValidator("json", createLabelSchema), async (c) => {
    const workspace = c.get("workspace");
    const { name } = c.req.valid("json");

    try {
      const label = await labelService.createLabel({
        name,
        workspaceId: workspace.id,
      });

      return c.json({ label }, 201);
    } catch (error) {
      if (error instanceof Error && error.message === "Label with this name already exists") {
        throw new HTTPException(400, { message: error.message });
      }
      throw error;
    }
  })
  .delete("/:labelId", async (c) => {
    const workspace = c.get("workspace");
    const { labelId } = c.req.param();

    try {
      await labelService.deleteLabel({
        labelId,
        workspaceId: workspace.id,
      });

      return c.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === "Label not found") {
        throw new HTTPException(404, { message: error.message });
      }
      throw error;
    }
  });

export { labelRoutes };

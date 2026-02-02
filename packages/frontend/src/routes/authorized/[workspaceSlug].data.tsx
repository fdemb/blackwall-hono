import { api } from "@/lib/api";
import { setCurrentWorkspaceSlug } from "@/lib/workspace-slug";
import { query, redirect } from "@solidjs/router";

export const workspaceLoader = query(async (workspaceSlug: string) => {
  setCurrentWorkspaceSlug(workspaceSlug);
  const result = await api.workspaces[":slug"].$get({
    param: {
      slug: workspaceSlug,
    },
  });

  const { workspace } = await result.json();

  if (!workspace) {
    throw redirect("/");
  }

  const teamsRes = await api.teams.$get();
  const { teams } = await teamsRes.json();

  return { workspace, teams };
}, "workspaceLayout");

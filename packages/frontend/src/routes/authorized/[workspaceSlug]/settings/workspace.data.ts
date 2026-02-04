import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const workspaceMembersLoader = query(async (workspaceSlug: string) => {
  const res = await api.api.workspaces[":slug"].members.$get({
    param: { slug: workspaceSlug },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch workspace members");
  }

  const { members } = await res.json();
  return members;
}, "workspaceMembers");

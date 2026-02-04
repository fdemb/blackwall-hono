import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const membersLoader = query(async (slug: string) => {
  const res = await api.api.workspaces[":slug"].members.$get({
    param: {
      slug,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch members");
  }

  const { members } = await res.json();
  return members;
}, "members");

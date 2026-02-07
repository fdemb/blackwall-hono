import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const sprintsLoader = query(async (teamKey: string) => {
  const res = await api.api["issue-sprints"].teams[":teamKey"].sprints.$get({
    param: { teamKey },
  });

  if (!res.ok) {
    throw new Error("Failed to load sprints");
  }

  const { sprints } = await res.json();
  return sprints;
}, "sprints");

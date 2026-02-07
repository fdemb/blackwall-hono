import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const sprintDetailLoader = query(async (teamKey: string, sprintId: string) => {
  const res = await api.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$get({
    param: { teamKey, sprintId },
  });

  if (!res.ok) {
    throw new Error("Sprint not found");
  }

  return await res.json(); // { sprint, issues }
}, "sprintDetail");

import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const sprintCompleteContextLoader = query(async (teamKey: string, sprintId: string) => {
  const res = await api.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"][
    "complete-context"
  ].$get({
    param: { teamKey, sprintId },
  });

  if (!res.ok) {
    throw new Error("Sprint not found");
  }

  return await res.json(); // { sprint, plannedSprints, hasUndoneIssues }
}, "sprintCompleteContext");

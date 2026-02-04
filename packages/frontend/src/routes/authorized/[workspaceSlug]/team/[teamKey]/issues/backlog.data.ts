import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const backlogLoader = query(async (teamKey: string) => {
  const res = await api.api.issues.$get({
    query: {
      teamKey,
      statusFilters: ["backlog"],
    },
  });

  const { issues } = await res.json();
  return issues;
}, "backlogIssues");

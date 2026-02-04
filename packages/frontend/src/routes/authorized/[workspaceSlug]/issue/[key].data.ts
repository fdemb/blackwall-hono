import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const issueLoader = query(async (issueKey: string, workspaceSlug: string) => {
  const issueRes = await api.api.issues[":issueKey"].$get({
    param: { issueKey },
  });

  const { issue } = await issueRes.json();

  const labelsRes = await api.api.labels.$get();
  const { labels } = await labelsRes.json();

  const res = await api.api.workspaces[":slug"].members.$get({
    param: { slug: workspaceSlug },
  });

  const { members } = await res.json();

  return {
    issue,
    labels,
    assignableUsers: members,
  };
}, "issueShow");

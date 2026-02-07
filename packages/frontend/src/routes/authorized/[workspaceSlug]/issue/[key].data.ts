import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const issueLoader = query(async (issueKey: string, workspaceSlug: string) => {
  const issueRes = await api.api.issues[":issueKey"].$get({
    param: { issueKey },
  });

  const { issue } = await issueRes.json();
  const teamKey = issue.team?.key;

  const labelsRes = await api.api.labels.$get();
  const { labels } = await labelsRes.json();

  const res = await api.api.workspaces[":slug"].members.$get({
    param: { slug: workspaceSlug },
  });

  const { members } = await res.json();

  const sprintsRes = teamKey
    ? await api.api["issue-sprints"].teams[":teamKey"].sprints.$get({
        param: { teamKey },
      })
    : null;

  const sprints = sprintsRes ? (await sprintsRes.json()).sprints : [];
  const openSprints = sprints.filter((sprint) => sprint.status !== "completed");

  return {
    issue,
    labels,
    assignableUsers: members,
    openSprints,
  };
}, "issueShow");

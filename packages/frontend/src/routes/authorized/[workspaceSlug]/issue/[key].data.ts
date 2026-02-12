import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const issueLoader = query(async (issueKey: string, workspaceSlug: string) => {
  const teamKey = issueKey.split("-")[0];
  if (!teamKey) {
    throw new Error("Invalid issue key");
  }

  const [issueRes, labelsRes, membersRes, sprintsRes] = await Promise.all([
    api.api.issues[":issueKey"].$get({
      param: { issueKey },
    }),
    api.api.labels.$get(),
    api.api.workspaces[":slug"].members.$get({
      param: { slug: workspaceSlug },
    }),
    teamKey
      ? api.api["issue-sprints"].teams[":teamKey"].sprints.$get({
          param: { teamKey },
        })
      : null,
  ]);

  const { issue } = await issueRes.json();
  const { labels } = await labelsRes.json();
  const { members } = await membersRes.json();
  const sprints = sprintsRes ? (await sprintsRes.json()).sprints : [];
  const openSprints = sprints.filter((sprint) => sprint.status !== "completed");

  return {
    issue,
    labels,
    assignableUsers: members,
    openSprints,
  };
}, "issueShow");

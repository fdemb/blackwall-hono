import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const myIssuesLoader = query(async (args: { workspaceSlug: string }) => {
  const [issuesRes] = await Promise.all([api.api.issues.my.$get()]);

  const { issues } = await issuesRes.json();

  return { issues };
}, "myIssues");

import { useWorkspaceData } from "@/context/workspace-context";
import { Navigate } from "@solidjs/router";

export default function NavigateToMyIssues() {
  const workspaceData = useWorkspaceData();

  return <Navigate href={`/${workspaceData().workspace.slug}/my-issues`} />;
}

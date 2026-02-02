import { useSessionData } from "@/context/session-context";
import { useWorkspaceData } from "@/context/workspace-context";

export default function SomePage() {
  const sessionData = useSessionData();
  const workspace = useWorkspaceData();

  return (
    <pre>{JSON.stringify({ sessionData: sessionData(), workspace: workspace() }, null, 2)}</pre>
  );
}

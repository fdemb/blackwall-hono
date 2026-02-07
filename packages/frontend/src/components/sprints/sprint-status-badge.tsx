import { Badge } from "@/components/custom-ui/badge";
import type { SerializedIssueSprint } from "@blackwall/database/schema";

type SprintStatus = "active" | "completed" | "inactive";

function getSprintStatus(sprint: SerializedIssueSprint, activeSprintId: string | null): SprintStatus {
  if (activeSprintId === sprint.id) {
    return "active";
  }

  if (sprint.finishedAt) {
    return "completed";
  }

  return "inactive";
}

const statusStyles: Record<SprintStatus, { label: string; color: "green" | "blue" | "normal" }> = {
  active: { label: "Active", color: "green" },
  completed: { label: "Completed", color: "blue" },
  inactive: { label: "Inactive", color: "normal" },
};

export function SprintStatusBadge(props: { sprint: SerializedIssueSprint; activeSprintId: string | null }) {
  const status = () => getSprintStatus(props.sprint, props.activeSprintId);
  const style = () => statusStyles[status()];

  return (
    <Badge size="sm" color={style().color} class="whitespace-nowrap">
      {style().label}
    </Badge>
  );
}

import { Badge } from "@/components/custom-ui/badge";
import type { SerializedIssueSprint } from "@blackwall/database/schema";

const statusStyles: Record<
  SerializedIssueSprint["status"],
  { label: string; color: "green" | "blue" | "normal" }
> = {
  planned: { label: "Planned", color: "normal" },
  active: { label: "Active", color: "green" },
  completed: { label: "Completed", color: "blue" },
};

export function SprintStatusBadge(props: { sprint: SerializedIssueSprint }) {
  const style = () => statusStyles[props.sprint.status];

  return (
    <Badge size="sm" color={style().color} class="whitespace-nowrap">
      {style().label}
    </Badge>
  );
}

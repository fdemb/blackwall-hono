import { Badge } from "@/components/custom-ui/badge";
import type { SerializedIssuePlan } from "@blackwall/database/schema";

type PlanStatus = "active" | "completed" | "inactive";

function getPlanStatus(plan: SerializedIssuePlan, activePlanId: string | null): PlanStatus {
  if (activePlanId === plan.id) {
    return "active";
  }

  if (plan.finishedAt) {
    return "completed";
  }

  return "inactive";
}

const statusStyles: Record<PlanStatus, { label: string; color: "green" | "blue" | "normal" }> = {
  active: { label: "Active", color: "green" },
  completed: { label: "Completed", color: "blue" },
  inactive: { label: "Inactive", color: "normal" },
};

export function PlanStatusBadge(props: { plan: SerializedIssuePlan; activePlanId: string | null }) {
  const status = () => getPlanStatus(props.plan, props.activePlanId);
  const style = () => statusStyles[status()];

  return (
    <Badge size="sm" color={style().color} class="whitespace-nowrap">
      {style().label}
    </Badge>
  );
}

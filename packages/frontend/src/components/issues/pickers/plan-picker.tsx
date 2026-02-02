import { PickerPopover } from "@/components/custom-ui/picker-popover";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { revalidate, action, useAction } from "@solidjs/router";
import { Popover } from "@kobalte/core/popover";
import ChevronsUpDownIcon from "lucide-solid/icons/chevrons-up-down";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import { createMemo, createSignal } from "solid-js";
import type { SerializedIssuePlan } from "@blackwall/backend/src/db/schema";

const updatePlan = action(async (issueKey: string, planId: string | null) => {
  await api.issues[`:issueKey`].$patch({
    param: { issueKey },
    json: { planId },
  });
  await revalidate("issue");
  await revalidate("board");
});

type PlanPickerPopoverProps = {
  planId: string | null;
  activePlan: SerializedIssuePlan | null;
  issueKey: string;
  workspaceSlug: string;
};

export function PlanPickerPopover(props: PlanPickerPopoverProps) {
  const [open, setOpen] = createSignal(false);
  const _update = useAction(updatePlan);

  const currentPlan = () =>
    props.planId && props.activePlan?.id === props.planId ? props.activePlan : null;

  const planOptions = createMemo(() => {
    const options: Array<{
      id: string | null;
      label: string;
      icon: () => any;
    }> = [
        {
          id: null,
          label: "No plan",
          icon: () => <LandPlotIcon class="size-4 text-muted-foreground" />,
        },
      ];

    if (props.activePlan) {
      options.push({
        id: props.activePlan.id,
        label: props.activePlan.name,
        icon: () => <LandPlotIcon class="size-4" />,
      });
    }

    return options;
  });

  const handleChange = async (id: string | null) => {
    _update(props.issueKey, id);
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="bottom-start" gutter={8}>
      <Popover.Trigger
        class="flex flex-row gap-2 items-center text-base px-2!"
        as={Button}
        variant="outline"
        size="lg"
        scaleEffect={false}
      >
        <LandPlotIcon class="size-4" />
        {currentPlan()?.name ?? "No plan"}
        <ChevronsUpDownIcon class="size-4" />
      </Popover.Trigger>

      <PickerPopover
        value={props.planId}
        onChange={handleChange}
        /* @ts-ignore */
        options={planOptions()}
      />
    </Popover>
  );
}

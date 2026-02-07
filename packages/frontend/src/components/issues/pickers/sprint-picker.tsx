import { PickerPopover } from "@/components/custom-ui/picker-popover";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { revalidate, action, useAction } from "@solidjs/router";
import { Popover } from "@kobalte/core/popover";
import ChevronsUpDownIcon from "lucide-solid/icons/chevrons-up-down";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import { createMemo, createSignal, Show, type JSX } from "solid-js";
import type { SerializedIssueSprint } from "@blackwall/database/schema";

const updateSprint = action(async (issueKey: string, sprintId: string | null) => {
  await api.api.issues[`:issueKey`].$patch({
    param: { issueKey },
    json: { sprintId },
  });
  await revalidate("issue");
  await revalidate("board");
});

type SprintPickerPopoverProps = {
  sprintId: string | null;
  openSprints: SerializedIssueSprint[];
  issueKey?: string;
  onChange?: (id: string | null) => Promise<void> | void;
  trigger?: JSX.Element;
};

export function SprintPickerPopover(props: SprintPickerPopoverProps) {
  const [open, setOpen] = createSignal(false);
  const _update = useAction(updateSprint);

  const currentSprint = createMemo(() =>
    props.openSprints.find((sprint) => sprint.id === props.sprintId),
  );

  const sprintOptions = createMemo(() => {
    const options: Array<{
      id: string | null;
      label: string;
      icon: () => any;
    }> = [
      {
        id: null,
        label: "No sprint",
        icon: () => <LandPlotIcon class="size-4 text-muted-foreground" />,
      },
    ];

    for (const sprint of props.openSprints) {
      options.push({
        id: sprint.id,
        label: sprint.name,
        icon: () => <LandPlotIcon class="size-4" />,
      });
    }

    return options;
  });

  const handleChange = async (id: string | null) => {
    if (props.onChange) {
      await props.onChange(id);
      return;
    }

    if (!props.issueKey) {
      return;
    }

    await _update(props.issueKey, id);
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="bottom-start" gutter={8}>
      <Show when={!props.trigger} fallback={props.trigger}>
        <Popover.Trigger
          class="flex flex-row gap-2 items-center text-base px-2!"
          as={Button}
          variant="outline"
          size="lg"
          scaleEffect={false}
        >
          {props.trigger ?? (
            <>
              <LandPlotIcon class="size-4" />
              {currentSprint()?.name ?? "No sprint"}
              <ChevronsUpDownIcon class="size-4" />
            </>
          )}
        </Popover.Trigger>
      </Show>

      <PickerPopover value={props.sprintId} onChange={handleChange} options={sprintOptions()} />
    </Popover>
  );
}

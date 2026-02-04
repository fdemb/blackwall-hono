import { PickerPopover } from "@/components/custom-ui/picker-popover";
import type { IssuePriority } from "@blackwall/database/schema";
import { issueMappings, mappingToOptionArray } from "@/lib/mappings";
import { Popover } from "@kobalte/core/popover";
import { IssuePriorityBadge } from "../issue-badges";

export function PriorityPickerPopover(props: {
  priority: IssuePriority;
  issueKey: string;
  workspaceSlug: string;
}) {
  const handleChange = async (priority: IssuePriority) => {
    // await handleChangePriority({
    //   data: {
    //     workspaceSlug: props.workspaceSlug,
    //     issueKey: props.issueKey,
    //     issuePriority: priority,
    //   },
    // });
  };

  return (
    <Popover placement="bottom-start" gutter={8}>
      <Popover.Trigger class="rounded-full [&>span]:hover:from-accent [&>span]:hover:to-accent [&>span]:hover:transition-colors">
        <IssuePriorityBadge priority={props.priority} />
      </Popover.Trigger>

      <PickerPopover
        value={props.priority}
        onChange={handleChange}
        options={mappingToOptionArray(issueMappings.priority)}
      />
    </Popover>
  );
}

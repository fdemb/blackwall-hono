import type { IssueForDataTable } from "./issue-datatable";
import type { IssuePlan, IssuePriority, IssueStatus, SerializedIssuePlan } from "@blackwall/backend/src/db/schema";
import type { User } from "better-auth";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import XIcon from "lucide-solid/icons/x";
import ChevronDownIcon from "lucide-solid/icons/chevron-down";
import TrashIcon from "lucide-solid/icons/trash-2";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import CircleDotIcon from "lucide-solid/icons/circle-dot";
import UserIcon from "lucide-solid/icons/user";
import { Show, createSignal } from "solid-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Popover } from "@kobalte/core/popover";
import { PickerPopover } from "../custom-ui/picker-popover";
import { issueMappings, mappingToOptionArray } from "@/lib/mappings";
import { UserAvatar } from "@/components/custom-ui/avatar";
import { action, useAction } from "@solidjs/router";
import type { BulkDeleteIssues, BulkUpdateIssues } from "@blackwall/backend/src/features/issues/issue.zod";
import { api } from "@/lib/api";
import { toast } from "../custom-ui/toast";

type IssueSelectionMenuProps = {
  selectedIssues: IssueForDataTable[];
  onClearSelection: () => void;
  activePlan?: SerializedIssuePlan | null;
  assignableUsers?: User[];
};


const updateIssuesBulkAction = action(async (input: BulkUpdateIssues) => {
  const res = await api.issues.bulk.$patch({
    json: input,
  });

  const json = await res.json();



  toast.success("Issues updated successfully");
  return json.issues;
})

const deleteIssuesBulkAction = action(async (input: BulkDeleteIssues) => {
  const res = await api.issues.bulk.$delete({
    json: input,
  });

  const json = await res.json();



  toast.success("Issues deleted successfully");
})

export function IssueSelectionMenu(props: IssueSelectionMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const _updateAction = useAction(updateIssuesBulkAction)
  const _deleteAction = useAction(deleteIssuesBulkAction)

  const handleUpdate = async (updates: BulkUpdateIssues["updates"]) => {
    await _updateAction({
      issueIds: props.selectedIssues.map((issue) => issue.id),
      updates,
    })
    props.onClearSelection();
  }

  const handleDelete = async () => {
    await _deleteAction({
      issueIds: props.selectedIssues.map((issue) => issue.id),
    })
    setDeleteDialogOpen(false);
    props.onClearSelection();
  };

  const assignableUsersOptions = () => {
    if (!props.assignableUsers?.length) return [];

    const options = props.assignableUsers.map((user) => ({
      id: user.id,
      label: user.name,
      icon: () => <UserAvatar user={user} size="xs" />,
    }));

    return [
      {
        id: null,
        label: "Unassigned",
        icon: () => <UserAvatar user={null} size="xs" />,
      },
      ...options,
    ];
  };

  return (
    <Show when={props.selectedIssues.length > 0}>
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 bg-background border rounded-lg shadow-lg">
        <Button variant="ghost" size="iconXs" onClick={props.onClearSelection}>
          <XIcon class="size-4" />
        </Button>

        <span class="text-sm text-muted-foreground">{props.selectedIssues.length} selected</span>

        <div class="h-4 w-px bg-border" />

        <Popover placement="top" gutter={8}>
          <Popover.Trigger as={Button} variant="outline" size="xs">
            <CircleDotIcon class="size-4" />
            Change status
          </Popover.Trigger>
          <PickerPopover
            value={null}
            onChange={(value) => handleUpdate({ status: value as unknown as IssueStatus })}
            options={mappingToOptionArray(issueMappings.status)}
          />
        </Popover>

        <Popover placement="top" gutter={8}>
          <Popover.Trigger as={Button} variant="outline" size="xs">
            <CircleDotIcon class="size-4" />
            Change priority
          </Popover.Trigger>
          <PickerPopover
            value={null}
            onChange={(value) => handleUpdate({ priority: value as unknown as IssuePriority })}
            options={mappingToOptionArray(issueMappings.priority)}
          />
        </Popover>

        <Show when={props.activePlan}>
          <Button variant="outline" size="xs" onClick={() => handleUpdate({ planId: props.activePlan!.id })}>
            <LandPlotIcon class="size-4" />
            Add to {props.activePlan!.name}
          </Button>
        </Show>

        <Show when={props.assignableUsers}>
          <Popover placement="top" gutter={8}>
            <Popover.Trigger as={Button} variant="outline" size="xs">
              <UserIcon class="size-4" />
              Assign to user
            </Popover.Trigger>
            <PickerPopover
              value={null}
              onChange={(value) => handleUpdate({ assignedToId: value as string | null })}
              options={assignableUsersOptions()}
            />
          </Popover>
        </Show>

        <DropdownMenu>
          <DropdownMenuTrigger as={Button} variant="outline" size="xs">
            More
            <ChevronDownIcon class="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteDialogOpen(true)}>
              <TrashIcon class="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia class="bg-destructive/50">
              <TrashIcon class="size-4" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {props.selectedIssues.length} issues?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
            <AlertDialogAction size="xs" variant="destructive" action={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Show>
  );
}

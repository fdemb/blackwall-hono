import { AssigneePickerPopover, StatusPickerPopover } from "@/components/issues/pickers";
import { useAppForm } from "@/context/form-context";
import type { IssueStatus, SerializedTeam } from "@blackwall/database/schema";
import { useDialogContext } from "@kobalte/core/dialog";
import { Popover } from "@kobalte/core/popover";
import type { JSONContent } from "@tiptap/core";
import PlusIcon from "lucide-solid/icons/plus";
import XIcon from "lucide-solid/icons/x";
import { createEffect, createSignal, mergeProps, on, onCleanup, onMount, Show } from "solid-js";
import * as z from "zod";
import { useKeybinds } from "../../context/keybind.context";
import { useWorkspaceData } from "../../context/workspace-context";
import { TeamAvatar } from "../custom-ui/avatar";
import { PickerPopover } from "../custom-ui/picker-popover";
import { TiptapEditor } from "../tiptap/tiptap-editor";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogSingleLineHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Kbd, KbdGroup } from "../ui/kbd";
import { TanStackErrorMessages, TextField } from "../ui/text-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { action, createAsync, query, redirect, useAction, useNavigate } from "@solidjs/router";
import { api } from "@/lib/api";
import type { CreateIssue } from "@blackwall/backend/src/features/issues/issue.zod";

type CreateDialogProps = {
  status?: IssueStatus;
  teamKey?: string;
  assignedToId?: string;
  sprintId?: string | null;
  global?: boolean;
  buttonSize?: "default" | "xxs" | "xs" | "sm" | "lg";
};

const getTeamUsers = query(async (teamKey: string) => {
  const res = await api.api.teams[":teamKey"].users.$get({
    param: {
      teamKey,
    },
  });

  const { users } = await res.json();

  return users;
}, "team-users");

const createIssueAction = action(
  async (issue: CreateIssue["issue"], workspaceSlug: string, teamKey: string) => {
    const res = await api.api.issues.$post({
      json: {
        issue,
        teamKey,
      },
    });

    const { issue: createdIssue } = await res.json();

    redirect(`/${workspaceSlug}/issue/${createdIssue.key}`);
  },
);

const uploadAttachmentAction = action(async (formData: FormData) => {
  api.api.issues.attachments.$post({
    form: {
      file: formData.get("file"),
    },
  });
});

function CreateDialog(props: CreateDialogProps) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger as="div" class="w-full">
          <DialogTrigger as={Button} size={props.buttonSize ?? "sm"} class="w-full">
            <PlusIcon class="size-4" strokeWidth={2.75} />
            Create
          </DialogTrigger>
        </TooltipTrigger>
        <Show when={props.global}>
          <TooltipContent>
            <span class="mr-2">Create a new issue</span>
            <KbdGroup>
              <Kbd>C</Kbd>
              then
              <Kbd>R</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Show>
      </Tooltip>

      <CreateDialogContent {...props} />
    </Dialog>
  );
}

function CreateDialogContent(props: CreateDialogProps) {
  const workspaceData = useWorkspaceData();
  const teams = () => workspaceData().teams;
  const merged = mergeProps(
    {
      status: "to_do" as IssueStatus,
      teamKey: teams().length > 0 ? teams()[0].key : "",
    },
    props,
  );

  const { addKeybind, removeKeybind } = useKeybinds();
  const { isOpen, close, toggle } = useDialogContext();
  const [summaryInputElement, setSummaryInputElement] = createSignal<HTMLInputElement | null>(null);
  const assignableUsers = createAsync(() => getTeamUsers(merged.teamKey));
  const _action = useAction(createIssueAction);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceSlug", workspaceData().workspace.slug);
    // No issueKey - creates orphan attachment for new issue

    const attachment = await uploadAttachmentAction(formData);
    return attachment;
  };

  const form = useAppForm(() => ({
    defaultValues: {
      teamKey: merged.teamKey,
      summary: "",
      description: undefined as unknown as JSONContent,
      status: merged.status,
      assignedToId: merged.assignedToId ?? null,
      sprintId: props.sprintId ?? null,
    },
    onSubmit: async ({ value }) => {
      await _action(value, workspaceData().workspace.slug, merged.teamKey);

      close();
      form.reset();
    },
    validators: {
      onSubmit: z.object({
        teamKey: z.string().min(1, "Team key is required"),
        summary: z.string().min(1, "Summary is required"),
        status: z.enum(["to_do", "in_progress", "done"], {
          error: "Status is required and must be one of the following: to_do, in_progress, done",
        }),
        description: z.any().refine((val) => val !== null && val !== undefined, {
          message: "Description is required",
        }),
        assignedToId: z.string().nullable(),
        sprintId: z.string().nullable(),
      }),
    },
  }));

  onMount(() => {
    if (props.global) {
      addKeybind("c r", () => {
        if (isOpen()) return;
        toggle();
      });
    }

    onCleanup(() => {
      removeKeybind("c r");
    });
  });

  createEffect(
    on([isOpen, summaryInputElement], ([open, summaryInputElement]) => {
      if (open && summaryInputElement) {
        requestAnimationFrame(() => {
          summaryInputElement.focus();
        });

        return;
      }

      if (!open) {
        setTimeout(() => {
          form.reset();
        }, 200);

        return;
      }
    }),
  );

  return (
    <DialogContent
      class="p-0 gap-0 max-h-screen overflow-auto"
      showCloseButton={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <DialogSingleLineHeader>
        <DialogTitle class="text-sm font-normal leading-none text-foreground">
          New issue
        </DialogTitle>
        <DialogClose as={Button} class="p-px! h-auto!" variant="ghost">
          <XIcon class="size-4" />
        </DialogClose>
      </DialogSingleLineHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div class="px-4 py-2 flex flex-col">
          <form.AppField name="summary">
            {(field) => (
              <TextField
                name={field().name}
                value={field().state.value}
                class="pb-3"
                validationState={field().state.meta.errors.length > 0 ? "invalid" : "valid"}
              >
                <TextField.Input
                  ref={setSummaryInputElement}
                  value={field().state.value}
                  onInput={(e: InputEvent) => {
                    const target = e.currentTarget as HTMLInputElement;
                    field().handleChange(target.value);
                  }}
                  onBlur={field().handleBlur}
                  placeholder="Issue title"
                  variant="unstyled"
                  class="text-xl"
                />
                <TanStackErrorMessages />
              </TextField>
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <TextField
                name={field().name}
                validationState={field().state.meta.errors.length > 0 ? "invalid" : "valid"}
                class="pb-2"
              >
                <TiptapEditor
                  initialContent={field().state.value}
                  onChange={(content) => field().handleChange(content)}
                  onAttachmentUpload={handleUpload}
                  workspaceSlug={workspaceData().workspace.slug}
                  variant="plain"
                  placeholder="Describe the issue..."
                  class="min-h-24"
                />
                <TanStackErrorMessages />
              </TextField>
            )}
          </form.AppField>
        </div>

        <div class="px-4 py-2 flex flex-row gap-2 flex-wrap">
          <form.AppField name="teamKey">
            {(field) => <TeamPicker teams={teams()} value={field().state.value} />}
          </form.AppField>

          <form.AppField name="assignedToId">
            {(field) => (
              <AssigneePickerPopover
                small
                controlled
                assignableUsers={assignableUsers() ?? []}
                assignedToId={field().state.value}
                teamKey={form.state.values.teamKey}
                workspaceSlug={workspaceData().workspace.slug}
                handleChange={field().handleChange}
              />
            )}
          </form.AppField>

          <form.AppField name="status">
            {(field) => (
              <StatusPickerPopover
                controlled
                status={field().state.value}
                onChange={field().handleChange}
              />
            )}
          </form.AppField>
        </div>

        <DialogFooter class="px-4 py-3 border-t">
          <form.Subscribe>
            {(state) => (
              <Button type="submit" size="sm" disabled={!state().canSubmit}>
                Create issue
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function TeamPicker(props: { teams: SerializedTeam[]; value: string }) {
  const team = props.teams.find((team) => team.key === props.value);
  const options = () =>
    props.teams.map((team) => ({
      id: team.key,
      label: team.name,
      icon: () => <TeamAvatar team={team} size="5" />,
    }));

  return (
    <Popover>
      <Popover.Trigger as={Button} variant="outline" size="sm" class="pl-1 pr-2 py-1 h-auto">
        <TeamAvatar team={team} size="5" />
        <span class="truncate">{team?.name ?? "Select team"}</span>
      </Popover.Trigger>
      <PickerPopover options={options()} value={props.value} />
    </Popover>
  );
}

export { CreateDialog, CreateDialogContent };

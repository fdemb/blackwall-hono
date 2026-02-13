import { AssigneePickerPopover, StatusPickerPopover } from "@/components/issues/pickers";
import { useAppForm } from "@/context/form-context";
import type {
  IssueStatus,
  SerializedIssueAttachment,
  SerializedTeam,
} from "@blackwall/database/schema";
import { useDialogContext } from "@kobalte/core/dialog";
import { Popover } from "@kobalte/core/popover";
import type { Editor, JSONContent } from "@tiptap/core";
import XIcon from "lucide-solid/icons/x";
import { createEffect, createSignal, mergeProps, on } from "solid-js";
import * as z from "zod";
import { useWorkspaceData } from "../../context/workspace-context";
import { TeamAvatar } from "../custom-ui/avatar";
import { PickerPopover } from "../custom-ui/picker-popover";
import { TiptapEditor } from "../tiptap/tiptap-editor";
import { Button } from "../ui/button";
import {
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogSingleLineHeader,
  DialogTitle,
} from "../ui/dialog";
import { TanStackErrorMessages, TextField } from "../ui/text-field";
import { action, createAsync, json, query, redirect, useAction } from "@solidjs/router";
import { api, apiFetch } from "@/lib/api";
import type { CreateIssue } from "@blackwall/backend/src/features/issues/issue.zod";
import type { CreateDialogDefaults } from "@/context/create-dialog.context";
import { m } from "@/paraglide/messages.js";

type CreateDialogContentProps = {
  defaults?: CreateDialogDefaults;
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

    throw redirect(`/${workspaceSlug}/issue/${createdIssue.key}`, {
      revalidate: [],
    });
  },
);

const uploadAttachmentAction = action(async (formData: FormData) => {
  const res = await apiFetch(api.api.issues.attachments.$url(), {
    method: "POST",
    body: formData,
  });

  const { attachment } = (await res.json()) as { attachment: SerializedIssueAttachment };

  return json(attachment, { revalidate: [] });
});

function CreateDialogContent(props: CreateDialogContentProps) {
  const workspaceData = useWorkspaceData();
  const teams = () => workspaceData().teams;
  const merged = mergeProps(
    {
      status: "to_do" as IssueStatus,
      teamKey: teams().length > 0 ? teams()[0].key : "",
    },
    () => props.defaults ?? {},
  );

  const { isOpen, close } = useDialogContext();
  const [summaryInputElement, setSummaryInputElement] = createSignal<HTMLInputElement | null>(null);
  const assignableUsers = createAsync(() => getTeamUsers(merged.teamKey));
  const _action = useAction(createIssueAction);
  const _uploadAttachmentAction = useAction(uploadAttachmentAction);
  const [editor, setEditor] = createSignal<Editor | null>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const attachment = await _uploadAttachmentAction(formData);
    return attachment;
  };

  const form = useAppForm(() => ({
    defaultValues: {
      teamKey: merged.teamKey,
      summary: "",
      description: undefined as unknown as JSONContent,
      status: merged.status,
      assignedToId: merged.assignedToId ?? null,
      sprintId: merged.sprintId ?? null,
    },
    onSubmit: async ({ value }) => {
      await _action(value, workspaceData().workspace.slug, merged.teamKey);

      close();
      form.reset();
    },
    validators: {
      onSubmit: z.object({
        teamKey: z.string().min(1, m.create_dialog_team_key_required()),
        summary: z.string().min(1, m.create_dialog_summary_required()),
        status: z.enum(["to_do", "in_progress", "done"], {
          error: m.create_dialog_status_required(),
        }),
        description: z.any().refine((val) => val !== null && val !== undefined, {
          message: m.create_dialog_description_required(),
        }),
        assignedToId: z.string().nullable(),
        sprintId: z.string().nullable(),
      }),
    },
  }));

  createEffect(
    on([isOpen, summaryInputElement], ([open, summaryInputElement]) => {
      if (open) {
        form.setFieldValue("teamKey", merged.teamKey);
        form.setFieldValue("status", merged.status);
        form.setFieldValue("assignedToId", merged.assignedToId ?? null);
        form.setFieldValue("sprintId", merged.sprintId ?? null);

        if (summaryInputElement) {
          requestAnimationFrame(() => {
            summaryInputElement.focus();
          });
        }

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

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor()) {
      return;
    }

    // Imperatively set the value of the description field just before submitting the form.
    // This way, we avoid serializing the editor content to JSON for each change.
    // This is very beneficial for performance.
    form.setFieldValue("description", editor()!.getJSON());

    await form.handleSubmit();
  };

  return (
    <DialogContent
      class="p-0 gap-0 max-h-screen overflow-auto"
      showCloseButton={false}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <DialogSingleLineHeader>
        <DialogTitle class="text-sm font-normal leading-none text-foreground">
          {m.create_dialog_title()}
        </DialogTitle>
        <DialogClose as={Button} class="p-px! h-auto!" variant="ghost">
          <XIcon class="size-4" />
        </DialogClose>
      </DialogSingleLineHeader>

      <form onSubmit={handleSubmit}>
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
                  placeholder={m.create_dialog_summary_placeholder()}
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
                  editorRef={setEditor}
                  initialContent={field().state.value}
                  onAttachmentUpload={handleUpload}
                  workspaceSlug={workspaceData().workspace.slug}
                  variant="plain"
                  placeholder={m.create_dialog_description_placeholder()}
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
                {m.create_dialog_submit()}
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
        <span class="truncate">{team?.name ?? m.create_dialog_select_team()}</span>
      </Popover.Trigger>
      <PickerPopover options={options()} value={props.value} />
    </Popover>
  );
}

export { CreateDialogContent };
export type { CreateDialogContentProps };

import { TiptapEditor } from "@/components/tiptap/tiptap-editor";
import { useWorkspaceData } from "@/context/workspace-context";
import type { SerializedIssue } from "@blackwall/backend/src/db/schema";
import { api } from "@/lib/api";
import { action } from "@/lib/form.utils";
import type { JSONContent } from "@tiptap/core";
import CheckIcon from "lucide-solid/icons/check";
import XIcon from "lucide-solid/icons/x";
import { createSignal, Show } from "solid-js";
import { Button } from "../ui/button";

export function IssueDescription(props: { issue: SerializedIssue }) {
  const workspaceData = useWorkspaceData();
  const [description, setDescription] = createSignal<JSONContent>(props.issue.description);
  const [isEditing, setIsEditing] = createSignal(false);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000"}/issues/${props.issue.key}/attachments`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "x-blackwall-workspace-slug": workspaceData().workspace.slug,
        },
      },
    );
    const { attachment } = await res.json();
    return attachment;
  };

  const save = async () => {
    if (JSON.stringify(description()) === JSON.stringify(props.issue.description)) {
      setIsEditing(false);
      return;
    }

    await action(
      api.api.issues[":issueKey"]
        .$patch({
          param: { issueKey: props.issue.key },
          json: { description: description() },
        })
        .then((res) => res.json()),
    );
    setIsEditing(false);
  };

  const cancel = () => {
    setDescription(props.issue.description);
    setIsEditing(false);
  };

  return (
    <div class="pt-6 relative">
      <TiptapEditor
        content={description()}
        onChange={(content) => {
          setDescription(content);
        }}
        onAttachmentUpload={handleUpload}
        workspaceSlug={workspaceData().workspace.slug}
        onBlur={save}
        variant="plain"
        editable={isEditing()}
        onPointerDown={() => {
          setIsEditing(true);
        }}
      />

      <Show when={isEditing()}>
        <div class="flex flex-row gap-2 absolute -bottom-11 left-0 z-100 bg-muted p-1 border rounded-md">
          <Button size="iconXs" variant="default" onClick={save}>
            <CheckIcon class="size-4" />
          </Button>
          <Button size="iconXs" variant="outline" onClick={cancel}>
            <XIcon class="size-4" />
          </Button>
        </div>
      </Show>
    </div>
  );
}

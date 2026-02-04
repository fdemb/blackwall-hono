import type { SerializedIssue } from "@blackwall/backend/src/db/schema";
import { api } from "@/lib/api";
import { action } from "@/lib/form.utils";
import CheckIcon from "lucide-solid/icons/check";
import XIcon from "lucide-solid/icons/x";
import { createSignal, Show } from "solid-js";
import { Button } from "../ui/button";

export function IssueSummary(props: { issue: SerializedIssue }) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [summary, setSummary] = createSignal(props.issue.summary);

  async function save() {
    if (summary() === props.issue.summary) {
      setIsEditing(false);
      return;
    }

    await action(
      api.api.issues[":issueKey"]
        .$patch({
          param: { issueKey: props.issue.key },
          json: { summary: summary() },
        })
        .then((res) => res.json()),
    );

    setIsEditing(false);
  }

  return (
    <div class="relative">
      <h1
        contentEditable={true}
        onPointerDown={() => {
          setIsEditing(true);
        }}
        class="w-full text-xl sm:text-2xl font-medium outline-none"
        onInput={(e) => {
          setSummary(e.target.textContent);
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData?.getData("text/plain") ?? "";
          e.target.textContent = text;
          setSummary(text);
        }}
        onBlur={save}
      >
        {props.issue.summary}
      </h1>

      <Show when={isEditing()}>
        <div class="flex flex-row gap-2 absolute -bottom-11 left-0 z-100 bg-muted p-1 border rounded-md">
          <Button size="iconXs" variant="default" onClick={save}>
            <CheckIcon class="size-4" />
          </Button>
          <Button size="iconXs" variant="outline" onClick={() => setIsEditing(false)}>
            <XIcon class="size-4" />
          </Button>
        </div>
      </Show>
    </div>
  );
}

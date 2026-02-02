import { Badge } from "@/components/custom-ui/badge";
import { type PickerOption } from "@/components/custom-ui/picker";
import { PickerPopover } from "@/components/custom-ui/picker-popover";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useWorkspaceData } from "@/context/workspace-context";
import { Popover } from "@kobalte/core/popover";
import PlusIcon from "lucide-solid/icons/plus";
import { createResource, createSignal, Index } from "solid-js";
import { action, useAction, revalidate } from "@solidjs/router";
import type { Label } from "@blackwall/backend/src/db/schema";

const createAndAddLabel = action(async (name: string, issueKey: string) => {
  const createRes = await api.labels.$post({
    json: { name },
  });
  const { label } = await createRes.json();
  await api.issues[`:issueKey`].labels.$post({
    param: { issueKey },
    json: { labelId: label.id },
  });
  await revalidate("issue");
});

const addLabel = action(async (labelId: string, issueKey: string) => {
  await api.issues[`:issueKey`].labels.$post({
    param: { issueKey },
    json: { labelId },
  });
  await revalidate("issue");
});

const removeLabel = action(async (labelId: string, issueKey: string) => {
  await api.issues[`:issueKey`].labels[`:labelId`].$delete({
    param: { issueKey, labelId },
  });
  await revalidate("issue");
});

export function IssueLabelsPicker(props: { labels: Label[]; issueKey: string }) {
  const [addOpen, setAddOpen] = createSignal(false);
  const workspaceData = useWorkspaceData();

  const labelIds = () => props.labels.map((label) => label.id);

  const _createAndAdd = useAction(createAndAddLabel);
  const _add = useAction(addLabel);
  const _remove = useAction(removeLabel);

  const [allLabels] = createResource(
    () => addOpen() === true,
    async () => {
      const res = await api.labels.$get();
      const { labels } = await res.json();
      return labels.map(
        (label) =>
          ({
            id: label.id,
            label: label.name,
          }) satisfies PickerOption,
      );
    },
  );

  const handleCreateNewLabel = async (name: string) => {
    _createAndAdd(name, props.issueKey);
  };

  const handleAddExistingLabel = async (id: string) => {
    _add(id, props.issueKey);
  };

  const handleRemoveLabel = async (id: string) => {
    _remove(id, props.issueKey);
  };

  function handleChange(id: string) {
    if (labelIds().includes(id)) {
      handleRemoveLabel(id);
    } else {
      handleAddExistingLabel(id);
    }
  }

  let savedAnchorRect: DOMRect | null = null;

  function handleAnchorRect(anchor?: HTMLElement) {
    if (savedAnchorRect) {
      return savedAnchorRect;
    }

    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      savedAnchorRect = rect;
      return rect;
    }
  }

  function handleSetOpen(value: boolean) {
    if (!value) {
      savedAnchorRect = null;
    }
    setAddOpen(value);
  }

  return (
    <div class="flex flex-wrap gap-y-2 gap-x-1 items-center">
      <Index each={props.labels}>
        {(label) => <Badge color={label().colorKey}>{label().name}</Badge>}
      </Index>

      <Popover
        placement="left-start"
        gutter={8}
        open={addOpen()}
        onOpenChange={handleSetOpen}
        getAnchorRect={handleAnchorRect}
      >
        <Popover.Trigger
          class="text-muted-foreground hover:text-foreground transition-colors rounded-full size-6"
          as={Button}
          variant="ghost"
          size="sm"
        >
          <PlusIcon class="size-4" />
        </Popover.Trigger>

        <PickerPopover
          multiple
          createNew
          options={allLabels() ?? []}
          value={labelIds()}
          loading={allLabels.loading}
          emptyText="No labels found. Start typing to create."
          createNewLabel="Create label"
          onCreateNew={handleCreateNewLabel}
          onChange={handleChange}
        />
      </Popover>
    </div>
  );
}

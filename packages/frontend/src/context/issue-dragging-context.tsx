import type { SerializedIssue, SerializedIssueSprint } from "@blackwall/database";
import { createIssueDnD, IssueDnDContext, useIssueDnD } from "@/lib/issue-dnd";
import { m } from "@/paraglide/messages.js";
import { For, onCleanup, Show, type Accessor, type Component, type ParentComponent } from "solid-js";
import { Portal } from "solid-js/web";

const DragOverlay: Component<{ issues: SerializedIssue[]; x: number; y: number }> = (props) => {
  return (
    <Portal mount={document.body}>
      <div
        class="p-3 squircle-md border text-sm fixed top-0 left-0 bg-accent text-accent-foreground shadow-lg flex flex-row gap-2 items-center z-100 pointer-events-none"
        style={{
          "touch-action": "none",
          translate: `${props.x}px ${props.y}px`,
        }}
      >
        <Show when={props.issues.length > 1} fallback={
          <>
            <span class="text-muted-foreground">{props.issues[0]?.key}</span>
            <span>{props.issues[0]?.summary}</span>
          </>
        }>
          <span>{m.issue_dragging_overlay_count({ count: String(props.issues.length) })}</span>
        </Show>
      </div>
    </Portal>
  );
};

const SprintDropZone: Component<{ sprint: SerializedIssueSprint }> = (props) => {
  const { setDropZoneRef, removeDropZoneRef, dragState } = useIssueDnD();

  onCleanup(() => removeDropZoneRef(props.sprint.id));

  const count = () => dragState.draggedIssues.length;

  return (
    <div
      ref={(el) => setDropZoneRef(props.sprint.id, el)}
      class="bg-card squircle-md border border-dashed fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center px-6 py-4 animate-in slide-in-from-bottom-4 fade-in-50 ease-out transition-shadow data-[drop-hover]:ring-2 data-[drop-hover]:ring-primary"
      data-dropzone
    >
      {count() > 1
        ? m.issue_dragging_drop_multiple({ count: String(count()), sprintName: props.sprint.name })
        : m.issue_dragging_drop_single({ sprintName: props.sprint.name })}
    </div>
  );
};

type IssueDraggingProviderProps = {
  sprints: SerializedIssueSprint[];
  selectedIssues?: Accessor<SerializedIssue[]>;
  onDrop?: (issues: SerializedIssue[], sprint: SerializedIssueSprint) => void;
};

const IssueDraggingProvider: ParentComponent<IssueDraggingProviderProps> = (props) => {
  const dnd = createIssueDnD({
    sprints: () => props.sprints,
    getSelectedIssues: props.selectedIssues,
    onDrop: props.onDrop,
  });

  return (
    <IssueDnDContext.Provider value={dnd}>
      <Show when={dnd.dragState.draggedIssues.length > 0}>
        <DragOverlay issues={dnd.dragState.draggedIssues} x={dnd.dragState.cursorX} y={dnd.dragState.cursorY} />
        <For each={props.sprints}>
          {(sprint) => <SprintDropZone sprint={sprint} />}
        </For>
      </Show>
      {props.children}
    </IssueDnDContext.Provider>
  );
};

export { IssueDraggingProvider, useIssueDnD as useIssueDragCtx };

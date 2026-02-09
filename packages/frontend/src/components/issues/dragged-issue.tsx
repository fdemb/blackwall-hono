import type { SerializedIssue, SerializedIssueSprint } from "@blackwall/database";
import { DragGesture } from "@use-gesture/vanilla";
import type { Accessor, Setter } from "solid-js";
import { onCleanup, onMount, useContext } from "solid-js";
import { createContext, createSignal, Show, type Component } from "solid-js";
import type { ParentComponent } from "solid-js";
import { Portal } from "solid-js/web";

type IssueDraggingState = {
  issue: Accessor<SerializedIssue | null>;
  dropZoneRect: Accessor<{ x: number; y: number; width: number; height: number } | null>;
  setIssue: Setter<SerializedIssue | null>;
  setCoordinates: Setter<{ x: number; y: number }>;
};

const IssueDraggingContext = createContext<IssueDraggingState | null>(null);

const DraggedIssue: Component<{
  issue: SerializedIssue;
  coordinates: { x: number; y: number };
}> = (props) => {
  return (
    <Portal mount={document.body}>
      <div
        class="p-3 squircle-md border text-sm fixed top-0 left-0 bg-accent text-accent-foreground shadow-lg flex flex-row gap-2 items-center z-100 pointer-events-none"
        style={{
          "touch-action": "none",
          translate: `${props.coordinates.x}px ${props.coordinates.y}px`,
        }}
      >
        <span class="text-muted-foreground">{props.issue.key}</span>
        <span>{props.issue.summary}</span>
      </div>
    </Portal>
  );
};

const SprintDropZone: Component<{
  // sprint: SerializedIssueSprint;
  setRect: Setter<{ x: number; y: number; width: number; height: number } | null>;
}> = (props) => {
  let ref!: HTMLDivElement;

  onMount(() => {
    const rect = ref.getBoundingClientRect();
    props.setRect({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
  });

  onCleanup(() => {
    props.setRect(null);
  });

  return (
    <div
      class="bg-card squircle-md border border-dashed absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center px-6 py-4 animate-in slide-in-from-bottom-4 fade-in-50 ease-out"
      ref={ref}
      data-dropzone
    >
      Drop here to move issue to sprint
    </div>
  );
};

const useIssueDragCtx = () => {
  const context = useContext(IssueDraggingContext);
  if (!context) {
    throw new Error("useIssueDrag must be used within a IssueDraggingProvider");
  }
  return context;
};

const useIssueDrag = (issue: SerializedIssue) => {
  const [ref, setRef] = createSignal<HTMLAnchorElement | HTMLDivElement | null>(null);
  let gesture!: DragGesture;
  const { setIssue, setCoordinates, dropZoneRect } = useIssueDragCtx();

  onMount(() => {
    if (!ref()) {
      console.error("ref not set for useIssueDrag");
      return;
    }

    gesture = new DragGesture(
      ref()!,
      ({ active, xy: [x, y] }) => {
        if (active) {
          setIssue(issue);
          setCoordinates({ x, y });
          return;
        }

        if (!active && dropZoneRect()) {
          if (
            x >= dropZoneRect()!.x &&
            x <= dropZoneRect()!.x + dropZoneRect()!.width &&
            y >= dropZoneRect()!.y &&
            y <= dropZoneRect()!.y + dropZoneRect()!.height
          ) {
            console.log("DROPPED", issue);
          }
        }
        setIssue(null);
      },
      {
        delay: 500,
        filterTaps: true,
      },
    );
  });

  onCleanup(() => {
    gesture.destroy();
    setIssue(null);
  });

  return { setDragTrigger: setRef };
};

const IssueDraggingProvider: ParentComponent = (props) => {
  const [issue, setIssue] = createSignal<SerializedIssue | null>(null);
  const [coordinates, setCoordinates] = createSignal<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dropZoneRect, setDropZoneRect] = createSignal<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const ctx = () => ({
    issue,
    setIssue,
    dropZoneRect,
    setCoordinates,
  });

  return (
    <IssueDraggingContext.Provider value={ctx()}>
      <Show when={issue()}>
        {(issue) => (
          <>
            <DraggedIssue issue={issue()} coordinates={coordinates()} />
            <SprintDropZone setRect={setDropZoneRect} />
          </>
        )}
      </Show>
      {props.children}
    </IssueDraggingContext.Provider>
  );
};

export { DraggedIssue, IssueDraggingProvider, useIssueDragCtx, useIssueDrag };

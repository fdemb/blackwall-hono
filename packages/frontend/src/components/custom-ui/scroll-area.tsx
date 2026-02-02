import { cn } from "@/lib/utils";
import * as scrollArea from "@zag-js/scroll-area";
import { normalizeProps, useMachine } from "@zag-js/solid";
import { createMemo, createUniqueId, Show, splitProps, type JSX } from "solid-js";

export function ScrollContainer(props: {
  children?: JSX.Element;
  class?: string;
  scrollAreaClass?: string;
}) {
  const [local, rest] = splitProps(props, ["children", "class", "scrollAreaClass"]);

  return (
    <div class={cn("relative flex min-h-0 h-full w-full flex-1 flex-col", local.class)} {...rest}>
      <ScrollArea class={local.scrollAreaClass}>{local.children}</ScrollArea>
    </div>
  );
}

type ScrollAreaProps = {
  children?: JSX.Element;
  class?: string;
  rootClass?: string;
  viewportClass?: string;
  contentClass?: string;
};

export function ScrollArea(props: ScrollAreaProps) {
  const service = useMachine(scrollArea.machine, {
    id: createUniqueId(),
  });

  const api = createMemo(() => scrollArea.connect(service, normalizeProps));

  return (
    <div
      {...api().getRootProps()}
      class={cn(
        "flex flex-col overflow-hidden max-h-full group/scrollarea",
        props.rootClass,
        props.class,
      )}
    >
      <div
        {...api().getViewportProps()}
        class={cn("w-full h-full [scrollbar-width:none] flex-col flex", props.viewportClass)}
      >
        <div {...api().getContentProps()} class={cn("min-w-0!", props.contentClass)}>
          {props.children}
        </div>
      </div>
      <Show when={api().hasOverflowY}>
        <div
          {...api().getScrollbarProps({ orientation: "vertical" })}
          class="absolute right-0 top-0 flex h-full w-2.5 touch-none p-px transition-colors select-none"
        >
          <div
            {...api().getThumbProps({ orientation: "vertical" })}
            class="bg-border relative w-full rounded-full"
          />
        </div>
      </Show>
      <Show when={api().hasOverflowX}>
        <div
          {...api().getScrollbarProps({ orientation: "horizontal" })}
          class="absolute bottom-0 left-0 flex h-2.5 w-full touch-none p-px transition-colors select-none"
        >
          <div
            {...api().getThumbProps({ orientation: "horizontal" })}
            class="bg-border relative rounded-full"
          />
        </div>
      </Show>
    </div>
  );
}

/**
 * <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
 */

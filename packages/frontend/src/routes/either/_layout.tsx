import { AuthShell } from "@/components/blocks/auth";
import { MaybeSessionContext } from "@/context/maybe-session.context";
import { m } from "@/paraglide/messages";
import { A, createAsync } from "@solidjs/router";
import { Show, type Component, type ParentComponent } from "solid-js";
import { eitherLoader } from "./_layout.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SerializedWorkspace } from "@blackwall/database";
import ArrowLeft from "lucide-solid/icons/arrow-left";

const EitherLayout: ParentComponent = (props) => {
  const loaderData = createAsync(() => eitherLoader());
  const session = () => loaderData()?.sessionData ?? null;

  return (
    <MaybeSessionContext.Provider value={session}>
      <Show when={loaderData()?.preferredWorkspace}>
        <BackButton preferredWorkspace={loaderData()?.preferredWorkspace!} />
      </Show>
      <AuthShell>{props.children}</AuthShell>;
    </MaybeSessionContext.Provider>
  );
};

const BackButton: Component<{ preferredWorkspace: SerializedWorkspace }> = (props) => {
  return (
    <A
      class={cn(buttonVariants({ variant: "ghost" }), "absolute top-3 left-3 z-100")}
      href={`/${props.preferredWorkspace.slug}`}
    >
      <ArrowLeft class="size-4" />
      {m.either_back_button({ workspace: props.preferredWorkspace.displayName })}
    </A>
  );
};

export default EitherLayout;

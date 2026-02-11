import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { SerializedIssueSprint } from "@blackwall/database/schema";
import { A, useParams } from "@solidjs/router";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import PlayIcon from "lucide-solid/icons/play";
import { Show } from "solid-js";

export function BoardEmpty(props: {
  plannedSprint: SerializedIssueSprint | null;
  onStartPlannedSprint: (sprintId: string) => Promise<void>;
}) {
  const params = useParams();
  return (
    <Empty class="min-h-[calc(100dvh-16rem)] w-full flex items-center justify-center">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LandPlotIcon />
        </EmptyMedia>
        <EmptyTitle>No active sprint</EmptyTitle>
        <EmptyDescription>
          Start a planned sprint or create a new one to use the board.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-row gap-3">
          <Show when={props.plannedSprint}>
            {(plannedSprint) => (
              <Button onClick={() => props.onStartPlannedSprint(plannedSprint().id)}>
                <PlayIcon class="size-4" />
                Start {plannedSprint().name}
              </Button>
            )}
          </Show>
          <A
            href={`/${params.workspaceSlug}/team/${params.teamKey}/sprints/create`}
            class={buttonVariants({ variant: props.plannedSprint ? "secondary" : "default" })}
          >
            Create sprint
          </A>
        </div>
      </EmptyContent>
    </Empty>
  );
}

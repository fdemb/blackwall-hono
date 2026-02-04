import { CreateDialogContent } from "@/components/blocks/create-dialog";
import { PageHeader } from "@/components/blocks/page-header";
import { TeamAvatar, UserAvatar } from "@/components/custom-ui/avatar";
import { Badge } from "@/components/custom-ui/badge";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { IssueStatus, SerializedIssuePlan } from "@blackwall/database/schema";
import { BoardDnDContext, createBoardDnD, useBoardDnD } from "@/lib/dnd";
import { issueMappings } from "@/lib/mappings";
import { api } from "@/lib/api";
import { createAsync, useParams, A, action, useAction, useNavigate } from "@solidjs/router";
import CircleIcon from "lucide-solid/icons/circle";
import CircleCheckIcon from "lucide-solid/icons/circle-check";
import CircleDotDashedIcon from "lucide-solid/icons/circle-dot-dashed";
import PlusIcon from "lucide-solid/icons/plus";
import { createMemo, For, Index, Show, type Component } from "solid-js";
import { Dynamic } from "solid-js/web";
import { boardLoader } from "./board.data";
import { useTeamData } from "../../[teamKey]";
import type { InferDbType } from "@blackwall/database/types";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import ChevronDownIcon from "lucide-solid/icons/chevron-down";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type IssueForBoard = InferDbType<
  "issue",
  {
    assignedTo: true;
    labels: true;
  }
>;

const moveIssue = action(async (issueKey: string, status: IssueStatus, order: number) => {
  await api.api.issues[":issueKey"].$patch({
    param: { issueKey },
    json: { status, order },
  });
});

export default function BoardPage() {
  const params = useParams();
  const teamData = useTeamData();
  const loaderData = createAsync(() => boardLoader(params.teamKey!));
  const _moveIssue = useAction(moveIssue);

  const dnd = createBoardDnD();
  const { dragState, calculateNewOrder, resetDrag } = dnd;

  const data = createMemo(() => {
    const issues = loaderData() ?? [];
    return issues.reduce(
      (acc, issue) => {
        if (!acc[issue.status]) {
          acc[issue.status] = [];
        }
        acc[issue.status].push(issue);
        return acc;
      },
      {} as Record<IssueStatus, IssueForBoard[]>,
    );
  });

  async function handleDrop() {
    if (!dragState.draggedIssueKey || !dragState.overColumnId) {
      resetDrag();
      return;
    }

    const issueKey = dragState.draggedIssueKey;
    const newStatus = dragState.overColumnId;
    const newOrder = calculateNewOrder(data()[newStatus] ?? [], dragState.overIndex, issueKey);

    resetDrag();

    await _moveIssue(issueKey, newStatus, newOrder);
  }

  return (
    <BoardDnDContext.Provider value={{ ...dnd, onDrop: handleDrop }}>
      <div class="flex flex-col">
        <PageHeader>
          <div class="flex flex-1 flex-row items-center justify-between">
            <Breadcrumbs>
              <BreadcrumbsItem>
                <div class="flex flex-row items-center gap-1">
                  <TeamAvatar team={teamData()} size="5" />
                  {teamData().name}
                </div>
              </BreadcrumbsItem>
              <BreadcrumbsItem>Board</BreadcrumbsItem>
            </Breadcrumbs>

            <PlanSection plan={teamData().activePlan} />
          </div>
        </PageHeader>
      </div>

      <ScrollContainer>
        <div class="p-4">
          <div class="flex flex-row gap-4 min-h-96 w-full relative">
            <BoardList
              statusName="To do"
              statusId="to_do"
              issues={data().to_do ?? []}
              statusIcon={CircleIcon}
            />
            <BoardList
              statusName="In progress"
              statusId="in_progress"
              issues={data().in_progress ?? []}
              statusIcon={CircleDotDashedIcon}
            />
            <BoardList
              statusName="Done"
              statusId="done"
              issues={data().done ?? []}
              statusIcon={CircleCheckIcon}
            />

            <Show when={dragState.isDragging && dragState.initialRect}>
              <DragOverlay issues={loaderData() ?? []} />
            </Show>
          </div>
        </div>
      </ScrollContainer>
    </BoardDnDContext.Provider>
  );
}

function DragOverlay(props: { issues: IssueForBoard[] }) {
  const { dragState } = useBoardDnD();
  const draggedIssue = createMemo(() =>
    props.issues.find((i) => i.key === dragState.draggedIssueKey),
  );

  return (
    <Show when={draggedIssue()}>
      {(issue) => (
        <div
          class="fixed pointer-events-none z-50 transition-transform duration-75"
          style={{
            left: `${dragState.initialRect!.left + dragState.dragX}px`,
            top: `${dragState.initialRect!.top + dragState.dragY}px`,
            width: `${dragState.initialRect!.width}px`,
          }}
        >
          <div class="p-4 ring-2 ring-primary rounded-md shadow-xl bg-card scale-105 opacity-95">
            <div class="w-full flex flex-col">
              <div class="pb-2">
                <p class="font-medium text-lg">{issue().summary}</p>
              </div>
              <Show when={issue().labels.length}>
                <div class="flex flex-wrap gap-2 items-center pb-2">
                  <Index each={issue().labels}>
                    {(label) => (
                      <Badge color={label().colorKey} size="sm">
                        {label().name}
                      </Badge>
                    )}
                  </Index>
                </div>
              </Show>
              <div class="flex flex-row gap-2 items-center justify-end w-full grow pt-2">
                <p class="font-normal text-muted-foreground">{issue().key}</p>
                <Show when={issue().assignedTo}>
                  <UserAvatar user={issue().assignedTo} size="sm" />
                </Show>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}

type BoardListProps = {
  statusName: string;
  statusId: IssueForBoard["status"];
  statusIcon?: Component<{
    class?: string;
  }>;
  issues: Array<IssueForBoard>;
  activePlan?: SerializedIssuePlan;
};

function BoardList(props: BoardListProps) {
  const mappedStatus = () => issueMappings.status[props.statusId];
  const params = useParams();
  const teamData = useTeamData();
  const { dragState, setColumnRef } = useBoardDnD();

  const isDropTarget = () => dragState.isDragging && dragState.overColumnId === props.statusId;

  const draggedIndex = createMemo(() =>
    props.issues.findIndex((i) => i.key === dragState.draggedIssueKey),
  );

  const displayIssues = createMemo(() => {
    return [...props.issues].sort((a, b) => a.order - b.order);
  });

  return (
    <div class="flex flex-col w-full max-w-80 group">
      <div class={`pb-2 text-sm flex flex-row items-center ${mappedStatus().textClass}`}>
        <Dynamic class="size-4 mr-1" component={props.statusIcon} />
        <p>{props.statusName}</p>
        <Badge size="sm" class="ml-2">
          {props.issues.length}
        </Badge>

        <Dialog>
          <DialogTrigger
            as={Button}
            variant="secondary"
            class="size-5! p-0! items-center! justify-center! ml-auto hidden group-hover:flex"
          >
            <PlusIcon class="size-4 shrink-0" />
          </DialogTrigger>
          <CreateDialogContent
            status={props.statusId}
            teamKey={params.teamKey!}
            planId={teamData().activePlanId}
          />
        </Dialog>
      </div>
      <div
        ref={(el) => setColumnRef(props.statusId, el)}
        class="bg-surface rounded-lg p-2 ring-1 ring-inset h-full grow flex flex-col gap-2.5"
        classList={{
          "ring-border dark:ring-white/10": !isDropTarget(),
          "ring-primary/50 bg-primary/5": isDropTarget(),
        }}
      >
        <Show
          when={displayIssues().length > 0 || isDropTarget()}
          fallback={<span class="p-6 text-center text-muted-foreground">No issues</span>}
        >
          <For each={displayIssues()}>
            {(issue, index) => (
              <>
                <Show
                  when={
                    isDropTarget() &&
                    dragState.overIndex ===
                      index() - (draggedIndex() !== -1 && index() > draggedIndex() ? 1 : 0) &&
                    issue.key !== dragState.draggedIssueKey
                  }
                >
                  <DropIndicator />
                </Show>
                <BoardItem issue={issue} />
              </>
            )}
          </For>
          <Show
            when={
              isDropTarget() &&
              dragState.overIndex >= displayIssues().length - (draggedIndex() !== -1 ? 1 : 0)
            }
          >
            <DropIndicator />
          </Show>
        </Show>
        <span role="none" class="h-20" />
      </div>
    </div>
  );
}

function DropIndicator() {
  return <div class="h-1 bg-primary rounded-full mx-1" />;
}

type BoardItemProps = {
  issue: IssueForBoard;
};

function BoardItem(props: BoardItemProps) {
  const { dragState, useDraggable, onDrop } = useBoardDnD();
  const navigate = useNavigate();
  const params = useParams();

  const isDragged = () => dragState.isDragging && dragState.draggedIssueKey === props.issue.key;

  const setRef = useDraggable(props.issue.key, props.issue.status, {
    onDrop,
  });

  return (
    <div
      ref={setRef}
      data-issue-key={props.issue.key}
      class="p-4 ring-1 ring-border rounded-md relative shadow-sm bg-card select-none cursor-grab active:cursor-grabbing"
      classList={{
        invisible: isDragged(),
      }}
      style={{ "touch-action": "none" }}
    >
      <A
        href={`/${params.workspaceSlug}/issue/${props.issue.key}`}
        draggable={false}
        class="absolute inset-0"
      />
      <div class="w-full flex flex-col">
        <div class="pb-2">
          <p class="font-medium text-lg">{props.issue.summary}</p>
        </div>

        <Show when={props.issue.labels.length}>
          <div class="flex flex-wrap gap-2 items-center pb-2">
            <Index each={props.issue.labels}>
              {(label) => (
                <Badge color={label().colorKey} size="sm">
                  {label().name}
                </Badge>
              )}
            </Index>
          </div>
        </Show>

        <div class="flex flex-row gap-2 items-center justify-end w-full grow pt-2">
          <p class="font-normal text-muted-foreground">{props.issue.key}</p>
          <Show when={props.issue.assignedTo}>
            <UserAvatar user={props.issue.assignedTo} size="sm" />
          </Show>
        </div>
      </div>
    </div>
  );
}

function PlanSection(props: { plan: SerializedIssuePlan | null }) {
  const params = useParams();

  return (
    <section class="flex flex-row gap-2 items-center">
      <Show
        when={props.plan}
        fallback={
          <>
            <div class="text-muted-foreground">No plan</div>
            <A
              href={`/${params.workspace!}/team/${params.teamKey!}/plans/create`}
              class={buttonVariants({
                variant: "secondary",
                size: "xxs",
                scaleEffect: false,
              })}
            >
              Create plan
            </A>
          </>
        }
      >
        {(plan) => (
          <Popover>
            <PopoverTrigger as={Button} variant="ghost" size="xxs" class="gap-1.5 font-semibold">
              <LandPlotIcon class="size-4 shrink-0" />
              {plan().name}
              <ChevronDownIcon class="size-3.5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent class="w-72 p-0">
              <div class="font-semibold text-accent-foreground flex flex-row items-center gap-1.5 px-4 py-3 border-b">
                <LandPlotIcon class="size-4 shrink-0" />
                {plan().name}
              </div>
              <div class="px-4 py-3 flex flex-col gap-3">
                <div class="flex flex-row items-center justify-between">
                  <p class="text-xs text-muted-foreground">Start date</p>
                  <p class="text-sm font-medium">
                    {new Date(plan().startDate).toLocaleDateString()}
                  </p>
                </div>

                <div class="flex flex-row items-center justify-between">
                  <p class="text-xs text-muted-foreground">End date</p>
                  <p class="text-sm font-medium">{new Date(plan().endDate).toLocaleDateString()}</p>
                </div>

                <Show when={plan().goal}>
                  <div>
                    <p class="text-xs text-muted-foreground mb-1">Goal</p>
                    <p class="text-sm">{plan().goal}</p>
                  </div>
                </Show>
              </div>
              <div class="px-4 py-3 border-t flex flex-row gap-2">
                <A
                  href={`/${params.workspace!}/team/${params.teamKey!}/plans/${plan().id}`}
                  class={buttonVariants({
                    variant: "outline",
                    size: "xs",
                    class: "flex-1",
                  })}
                >
                  Details
                </A>
                <A
                  href={`/${params.workspace!}/team/${params.teamKey!}/plans/${plan().id}/edit`}
                  class={buttonVariants({
                    variant: "outline",
                    size: "xs",
                    class: "flex-1",
                  })}
                >
                  Edit
                </A>
                <A
                  href={`/${params.workspace!}/team/${params.teamKey!}/plans/${plan().id}/complete`}
                  class={buttonVariants({
                    variant: "outline",
                    size: "xs",
                    class: "flex-1",
                  })}
                >
                  Complete
                </A>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </Show>
    </section>
  );
}

function BoardEmpty() {
  const params = useParams();
  return (
    <Empty class="min-h-96">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LandPlotIcon />
        </EmptyMedia>
        <EmptyTitle>No active plan</EmptyTitle>
        <EmptyDescription>
          Create a plan to start tracking your issues on the board.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="flex flex-row gap-3">
          <A
            href={`/${params.workspaceSlug}/team/${params.teamKey}/plans/create`}
            class={buttonVariants()}
          >
            Create plan
          </A>
          <A
            href={`/${params.workspaceSlug}/team/${params.teamKey}/issues/backlog`}
            class={buttonVariants({ variant: "secondary" })}
          >
            View backlog
          </A>
        </div>
      </EmptyContent>
    </Empty>
  );
}

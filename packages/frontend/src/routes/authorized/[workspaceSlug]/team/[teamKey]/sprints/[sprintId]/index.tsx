import { action, createAsync, redirect, useAction, useParams, A } from "@solidjs/router";
import { Show, createMemo, createSignal } from "solid-js";
import { sprintDetailLoader } from "./index.data";
import { useTeamData } from "../../../[teamKey]";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import CircleDotIcon from "lucide-solid/icons/circle-dot";
import { createRowSelection } from "@/components/datatable/row-selection-feature";
import { IssueDataTable, type IssueForDataTable } from "@/components/issues/issue-datatable";
import { IssueSelectionMenu } from "@/components/issues/issue-selection-menu";
import { formatDateShort } from "@/lib/dates";
import { api } from "@/lib/api";
import { buttonVariants, Button } from "@/components/ui/button";
import CalendarIcon from "lucide-solid/icons/calendar";
import TargetIcon from "lucide-solid/icons/target";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/custom-ui/toast";
import { SprintStatusBadge } from "@/components/sprints/sprint-status-badge";

const archiveSprintAction = action(async (workspaceSlug: string, teamKey: string, sprintId: string) => {
  await api.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$delete({
    param: { teamKey, sprintId },
  });

  toast.success("Sprint archived");
  throw redirect(`/${workspaceSlug}/team/${teamKey}/sprints`);
});

function calculateEstimationStats(issues: IssueForDataTable[]) {
  let totalPoints = 0;
  let completedPoints = 0;
  let estimatedCount = 0;

  for (const issue of issues) {
    if (issue.estimationPoints != null) {
      estimatedCount++;
      totalPoints += issue.estimationPoints;
      if (issue.status === "done") {
        completedPoints += issue.estimationPoints;
      }
    }
  }

  return {
    totalPoints,
    completedPoints,
    estimatedCount,
    totalCount: issues.length,
    progress: totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0,
  };
}

export default function SprintDetailPage() {
  const params = useParams();
  const teamData = useTeamData();
  const data = createAsync(() => sprintDetailLoader(params.teamKey!, params.sprintId!));
  const archiveAction = useAction(archiveSprintAction);
  const [archiveDialogOpen, setArchiveDialogOpen] = createSignal(false);

  const sprint = () => data()?.sprint;
  const isActiveSprint = () => teamData().activeSprintId === sprint()!.id;
  const isCompleted = () => Boolean(sprint()!.finishedAt);
  const issues = () => (data()?.issues ?? []) as IssueForDataTable[];
  const stats = () => calculateEstimationStats(issues());
  const rowSelection = createRowSelection();

  const selectedIssues = createMemo(() => {
    const selectedIds = rowSelection.getSelectedRowIds();
    const issueMap = new Map(issues().map((issue) => [issue.id, issue]));
    return selectedIds
      .map((id) => issueMap.get(id))
      .filter((issue): issue is IssueForDataTable => !!issue);
  });

  return (
    <Show when={sprint()}>
      <>
        <PageHeader>
          <Breadcrumbs>
            <BreadcrumbsItem
              linkProps={{
                href: `/${params.workspaceSlug}/team/${params.teamKey}/issues/board`,
              }}
            >
              <div class="flex flex-row items-center gap-1">
                <TeamAvatar team={teamData()} size="5" />
                {teamData().name}
              </div>
            </BreadcrumbsItem>
            <BreadcrumbsItem
              linkProps={{
                href: `/${params.workspaceSlug}/team/${params.teamKey}/sprints`,
              }}
            >
              Sprints
            </BreadcrumbsItem>
            <BreadcrumbsItem>{sprint()!.name}</BreadcrumbsItem>
          </Breadcrumbs>
        </PageHeader>

        <div class="flex flex-col flex-1 min-h-0">
          <div class="px-6 py-4 border-b flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h1 class="text-lg font-semibold">{sprint()!.name}</h1>
                <SprintStatusBadge sprint={sprint()!} activeSprintId={teamData().activeSprintId} />
              </div>
              <div class="flex items-center gap-2">
                <Show when={!isCompleted()}>
                  <A
                    class={buttonVariants({ variant: "outline", size: "sm" })}
                    href={`/${params.workspaceSlug}/team/${params.teamKey}/sprints/${params.sprintId}/edit`}
                  >
                    Edit
                  </A>
                </Show>
                <Show when={isActiveSprint() && !isCompleted()}>
                  <A
                    class={buttonVariants({ variant: "default", size: "sm" })}
                    href={`/${params.workspaceSlug}/team/${params.teamKey}/sprints/${params.sprintId}/complete`}
                  >
                    Complete sprint
                  </A>
                </Show>
                <Show when={!isActiveSprint()}>
                  <Button variant="outline" size="sm" onClick={() => setArchiveDialogOpen(true)}>
                    Archive
                  </Button>
                </Show>
              </div>
            </div>

            <div class="flex flex-row items-center gap-6 text-sm text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <CalendarIcon class="size-4" />
                <span>
                  {formatDateShort(new Date(sprint()!.startDate))} –{" "}
                  {formatDateShort(new Date(sprint()!.endDate))}
                </span>
              </div>
              <Show when={sprint()!.goal}>
                <div class="flex items-center gap-1.5">
                  <TargetIcon class="size-4" />
                  <span>{sprint()!.goal}</span>
                </div>
              </Show>
            </div>

            <Show when={stats().totalPoints > 0}>
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">
                    {stats().completedPoints} / {stats().totalPoints} points completed
                  </span>
                  <span class="text-muted-foreground">
                    {stats().estimatedCount} of {stats().totalCount} issues estimated
                  </span>
                </div>
                <div class="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${stats().progress}%` }}
                  />
                </div>
              </div>
            </Show>
          </div>

          <IssueSelectionMenu
            selectedIssues={selectedIssues()}
            onClearSelection={rowSelection.clearSelection}
            activeSprint={teamData().activeSprintId === sprint()!.id ? sprint()! : undefined}
          />

          <Show when={issues().length > 0} fallback={<SprintIssuesEmpty />}>
            <IssueDataTable
              issues={issues()}
              workspaceSlug={params.workspaceSlug!}
              rowSelection={rowSelection}
            />
          </Show>
        </div>

        <AlertDialog open={archiveDialogOpen()} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia class="bg-destructive/50" />
              <AlertDialogTitle>Archive this sprint?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the sprint and unassigns any issues still attached to it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
              <AlertDialogAction
                size="xs"
                variant="destructive"
                action={() => archiveAction(params.workspaceSlug!, params.teamKey!, sprint()!.id)}
              >
                Archive sprint
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </Show>
  );
}

function SprintIssuesEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDotIcon />
        </EmptyMedia>
        <EmptyTitle>No issues in this sprint</EmptyTitle>
        <EmptyDescription>
          Add issues to this sprint to track progress. You can assign existing issues or create new
          ones.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

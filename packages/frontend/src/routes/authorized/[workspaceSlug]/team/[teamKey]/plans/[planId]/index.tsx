import { createAsync, useParams, A } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import { planDetailLoader } from "./index.data";
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
import { buttonVariants } from "@/components/ui/button";
import CalendarIcon from "lucide-solid/icons/calendar";
import TargetIcon from "lucide-solid/icons/target";

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

export default function PlanDetailPage() {
  const params = useParams();
  const teamData = useTeamData();
  const data = createAsync(() => planDetailLoader(params.teamKey!, params.planId!));

  const plan = () => data()?.plan;
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
    <Show when={plan()}>
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
                href: `/${params.workspaceSlug}/team/${params.teamKey}/plans`,
              }}
            >
              Plans
            </BreadcrumbsItem>
            <BreadcrumbsItem>{plan()!.name}</BreadcrumbsItem>
          </Breadcrumbs>
        </PageHeader>

        <div class="flex flex-col flex-1 min-h-0">
          <div class="px-6 py-4 border-b flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h1 class="text-lg font-semibold">{plan()!.name}</h1>
              <A
                class={buttonVariants({ variant: "outline", size: "sm" })}
                href={`/${params.workspaceSlug}/team/${params.teamKey}/plans/${params.planId}/edit`}
              >
                Edit
              </A>
            </div>

            <div class="flex flex-row items-center gap-6 text-sm text-muted-foreground">
              <div class="flex items-center gap-1.5">
                <CalendarIcon class="size-4" />
                <span>
                  {formatDateShort(new Date(plan()!.startDate))} –{" "}
                  {formatDateShort(new Date(plan()!.endDate))}
                </span>
              </div>
              <Show when={plan()!.goal}>
                <div class="flex items-center gap-1.5">
                  <TargetIcon class="size-4" />
                  <span>{plan()!.goal}</span>
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
            activePlan={teamData().activePlanId === plan()!.id ? plan()! : undefined}
          />

          <Show when={issues().length > 0} fallback={<PlanIssuesEmpty />}>
            <IssueDataTable
              issues={issues()}
              workspaceSlug={params.workspaceSlug!}
              rowSelection={rowSelection}
            />
          </Show>
        </div>
      </>
    </Show>
  );
}

function PlanIssuesEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDotIcon />
        </EmptyMedia>
        <EmptyTitle>No issues in this plan</EmptyTitle>
        <EmptyDescription>
          Add issues to this plan to track progress. You can assign existing issues or create new
          ones.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

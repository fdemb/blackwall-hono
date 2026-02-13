import { PageHeader } from "@/components/blocks/page-header";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import ListIcon from "lucide-solid/icons/list";
import PlusIcon from "lucide-solid/icons/plus";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { createRowSelection } from "@/components/datatable/row-selection-feature";
import { IssueDataTable, type IssueForDataTable } from "@/components/issues/issue-datatable";
import { IssueSelectionMenu } from "@/components/issues/issue-selection-menu";
import { Button } from "@/components/ui/button";
import { useCreateDialog } from "@/context/create-dialog.context";
import { action, createAsync, useAction, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { allIssuesLoader } from "./all.data";
import { useTeamData } from "../../[teamKey]";
import { sprintsLoader } from "../sprints/index.data";
import { IssueDraggingProvider } from "@/context/issue-dragging-context";
import { api } from "@/lib/api";
import type { BulkUpdateIssues } from "@blackwall/backend/src/features/issues/issue.zod";
import { toast } from "@/components/custom-ui/toast";
import { HideWhileDragging } from "@/components/issues/hide-while-dragging";
import { m } from "@/paraglide/messages.js";

const moveToSprintAction = action(async (input: BulkUpdateIssues) => {
  await api.api.issues.bulk.$patch({ json: input });
  const count = input.issueIds.length;
  toast.success(
    count > 1
      ? m.issues_bulk_move_to_sprint_multiple({ count: String(count) })
      : m.issues_bulk_move_to_sprint_single(),
  );
});

export default function AllIssuesPage() {
  const params = useParams();
  const teamData = useTeamData();
  const issues = createAsync(() => allIssuesLoader(params.teamKey!));
  const sprints = createAsync(() => sprintsLoader(params.teamKey!));
  const moveToSprint = useAction(moveToSprintAction);
  const openSprints = createMemo(() => (sprints() ?? []).filter((sprint) => sprint.status !== "completed"));

  const rowSelection = createRowSelection();

  const selectedIssues = createMemo(() => {
    const selectedIds = rowSelection.getSelectedRowIds();
    const issueMap = new Map((issues() ?? []).map((issue) => [issue.id, issue]));
    return selectedIds
      .map((id) => issueMap.get(id))
      .filter((issue): issue is IssueForDataTable => !!issue);
  });

  return (
    <IssueDraggingProvider
      sprints={openSprints()}
      selectedIssues={selectedIssues}
      onDrop={(issues, sprint) => moveToSprint({ issueIds: issues.map((i) => i.id), updates: { sprintId: sprint.id } })}
    >
      <PageHeader>
        <Breadcrumbs>
          <BreadcrumbsItem>
            <div class="flex flex-row items-center gap-1">
              <TeamAvatar team={teamData()} size="5" />
              {teamData().name}
            </div>
          </BreadcrumbsItem>
          <BreadcrumbsItem>{m.team_issues_all_breadcrumb()}</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>

      <HideWhileDragging>
        <IssueSelectionMenu
          selectedIssues={selectedIssues()}
          onClearSelection={rowSelection.clearSelection}
          openSprints={openSprints()}
        />
      </HideWhileDragging>

      <Show when={issues() && issues()!.length > 0} fallback={<IssueEmpty />}>
        <IssueDataTable
          issues={issues()!}
          workspaceSlug={params.workspaceSlug!}
          rowSelection={rowSelection}
          issueDrag={true}
        />
      </Show>
    </IssueDraggingProvider>
  );
}

function IssueEmpty() {
  const { open } = useCreateDialog();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListIcon />
        </EmptyMedia>
        <EmptyTitle>{m.team_issues_all_empty_title()}</EmptyTitle>
        <EmptyDescription>{m.team_issues_all_empty_description()}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="w-auto">
          <Button onClick={() => open({ status: "to_do" })}>
            <PlusIcon class="size-4" strokeWidth={2.75} />
            {m.common_create()}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

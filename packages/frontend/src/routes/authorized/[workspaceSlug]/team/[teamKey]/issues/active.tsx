import { CreateDialog } from "@/components/blocks/create-dialog";
import { PageHeader } from "@/components/blocks/page-header";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import AlertCircleIcon from "lucide-solid/icons/alert-circle";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { createRowSelection } from "@/components/datatable/row-selection-feature";
import { IssueDataTable, type IssueForDataTable } from "@/components/issues/issue-datatable";
import { IssueSelectionMenu } from "@/components/issues/issue-selection-menu";
import { action, createAsync, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { activeIssuesLoader } from "./active.data";
import { useTeamData } from "../../[teamKey]";

export default function ActiveIssuesPage() {
  const params = useParams();
  const teamData = useTeamData();
  const issues = createAsync(() => activeIssuesLoader(params.teamKey!));

  const rowSelection = createRowSelection();

  const selectedIssues = createMemo(() => {
    const selectedIds = rowSelection.getSelectedRowIds();
    const issueMap = new Map((issues() ?? []).map((issue) => [issue.id, issue]));
    return selectedIds
      .map((id) => issueMap.get(id))
      .filter((issue): issue is IssueForDataTable => !!issue);
  });

  return (
    <>
      <PageHeader>
        <Breadcrumbs>
          <BreadcrumbsItem>
            <div class="flex flex-row items-center gap-1">
              <TeamAvatar team={teamData()} size="5" />
              {teamData().name}
            </div>
          </BreadcrumbsItem>
          <BreadcrumbsItem>Active Issues</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>

      <IssueSelectionMenu
        selectedIssues={selectedIssues()}
        onClearSelection={rowSelection.clearSelection}
      />

      <Show when={issues() && issues()!.length > 0} fallback={<IssueEmpty />}>
        <IssueDataTable
          issues={issues()!}
          workspaceSlug={params.workspaceSlug!}
          rowSelection={rowSelection}
        />
      </Show>
    </>
  );
}

function IssueEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircleIcon />
        </EmptyMedia>
        <EmptyTitle>No active issues</EmptyTitle>
        <EmptyDescription>
          There are no active issues in this team. You can create a new issue or move issues from
          the backlog.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="w-auto">
          <CreateDialog status="to_do" buttonSize="default" />
        </div>
      </EmptyContent>
    </Empty>
  );
}

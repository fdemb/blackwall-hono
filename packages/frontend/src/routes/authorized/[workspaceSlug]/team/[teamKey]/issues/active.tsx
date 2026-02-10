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
import PlusIcon from "lucide-solid/icons/plus";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { createRowSelection } from "@/components/datatable/row-selection-feature";
import { IssueDataTable, type IssueForDataTable } from "@/components/issues/issue-datatable";
import { IssueSelectionMenu } from "@/components/issues/issue-selection-menu";
import { Button } from "@/components/ui/button";
import { useCreateDialog } from "@/context/create-dialog.context";
import { createAsync, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { activeIssuesLoader } from "./active.data";
import { useTeamData } from "../../[teamKey]";
import { sprintsLoader } from "../sprints/index.data";

export default function ActiveIssuesPage() {
  const params = useParams();
  const teamData = useTeamData();
  const issues = createAsync(() => activeIssuesLoader(params.teamKey!));
  const sprints = createAsync(() => sprintsLoader(params.teamKey!));
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
        openSprints={openSprints()}
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
  const { open } = useCreateDialog();

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
          <Button onClick={() => open({ status: "to_do" })}>
            <PlusIcon class="size-4" strokeWidth={2.75} />
            Create
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

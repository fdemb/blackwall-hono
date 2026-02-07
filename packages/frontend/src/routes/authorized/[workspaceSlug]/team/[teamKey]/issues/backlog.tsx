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
import CircleDashedIcon from "lucide-solid/icons/circle-dashed";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { createRowSelection } from "@/components/datatable/row-selection-feature";
import { IssueDataTable, type IssueForDataTable } from "@/components/issues/issue-datatable";
import { IssueSelectionMenu } from "@/components/issues/issue-selection-menu";
import { createAsync, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { backlogLoader } from "./backlog.data";
import { useTeamData } from "../../[teamKey]";
import { sprintsLoader } from "../sprints/index.data";

export default function BacklogPage() {
  const params = useParams();
  const teamData = useTeamData();
  const issues = createAsync(() => backlogLoader(params.teamKey!));
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
          <BreadcrumbsItem>Backlog</BreadcrumbsItem>
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
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDashedIcon />
        </EmptyMedia>
        <EmptyTitle>Backlog is empty</EmptyTitle>
        <EmptyDescription>
          Add issues to the backlog to sprint future work. Backlog items can be moved to active sprints
          when ready.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="w-auto">
          <CreateDialog buttonSize="default" />
        </div>
      </EmptyContent>
    </Empty>
  );
}

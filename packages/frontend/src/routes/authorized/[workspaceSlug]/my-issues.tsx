import { CreateDialog } from "@/components/blocks/create-dialog";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { createRowSelection } from "@/components/datatable/row-selection-feature";
import { IssueDataTable, type IssueForDataTable } from "@/components/issues/issue-datatable";
import { IssueSelectionMenu } from "@/components/issues/issue-selection-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { createAsync, useParams } from "@solidjs/router";
import CircleDotIcon from "lucide-solid/icons/circle-dot";
import { createMemo, Show } from "solid-js";
import { myIssuesLoader } from "./my-issues.data";

export default function MyIssuesPage() {
  const params = useParams();

  const data = createAsync(() =>
    myIssuesLoader({
      workspaceSlug: params.workspaceSlug!,
    }),
  );

  const issues = createMemo(() => data()?.issues ?? []);

  const rowSelection = createRowSelection();

  const selectedIssues = createMemo(() => {
    const selectedIds = rowSelection.getSelectedRowIds();
    const issueMap = new Map(issues().map((issue) => [issue.id, issue]));
    return selectedIds
      .map((id) => issueMap.get(id))
      .filter((issue): issue is IssueForDataTable => !!issue);
  });

  return (
    <>
      <PageHeader>
        <Breadcrumbs>
          <BreadcrumbsItem>My issues</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>

      <IssueSelectionMenu
        selectedIssues={selectedIssues()}
        onClearSelection={rowSelection.clearSelection}
      />

      <Show when={issues().length > 0} fallback={<IssueEmpty />}>
        <IssueDataTable
          issues={issues()}
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
          <CircleDotIcon />
        </EmptyMedia>
        <EmptyTitle>No issues assigned to you</EmptyTitle>
        <EmptyDescription>
          Issues assigned to you will appear here. Create a new issue or ask a teammate to assign
          one to you.
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

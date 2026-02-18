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
import { Button } from "@/components/ui/button";
import { useCreateDialog } from "@/context/create-dialog.context";
import { useSessionData } from "@/context/session-context";
import { m } from "@/paraglide/messages.js";
import { createAsync, useParams } from "@solidjs/router";
import { Title, Meta } from "@solidjs/meta";
import CircleDotIcon from "lucide-solid/icons/circle-dot";
import PlusIcon from "lucide-solid/icons/plus";
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
      <Title>{m.meta_title_my_issues()}</Title>
      <Meta name="description" content={m.meta_desc_my_issues()} />
      <PageHeader>
        <Breadcrumbs>
          <BreadcrumbsItem>{m.my_issues_breadcrumb()}</BreadcrumbsItem>
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
  const { open } = useCreateDialog();
  const session = useSessionData();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleDotIcon />
        </EmptyMedia>
        <EmptyTitle>{m.my_issues_empty_title()}</EmptyTitle>
        <EmptyDescription>{m.my_issues_empty_description()}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div class="w-auto">
          <Button onClick={() => open({ assignedToId: session().user.id })}>
            <PlusIcon class="size-4" strokeWidth={2.75} />
            {m.my_issues_create_button()}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

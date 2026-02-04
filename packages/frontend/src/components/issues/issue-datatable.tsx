import { Badge } from "@/components/custom-ui/badge";
import { createDataTable } from "@/components/datatable/create-datatable";
import { DataTableHeaderless } from "@/components/datatable/datatable";
import type { RowSelectionResult } from "@/components/datatable/row-selection-feature";
import { createSelectionColumn } from "@/components/datatable/selection-column";
import { StatusPickerPopover } from "@/components/issues/pickers/status-picker";
import type { InferDbType } from "@blackwall/database/types";
import { formatDateShort } from "@/lib/dates";
import { issueMappings } from "@/lib/mappings";
import { createColumnHelper, type ColumnDef } from "@tanstack/solid-table";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import { A } from "@solidjs/router";
import { Index, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

export type IssueForDataTable = InferDbType<
  "issue",
  { assignedTo: true; labels: true; issuePlan: true; team: true }
>;

export type IssueDataTableProps = {
  issues: IssueForDataTable[];
  workspaceSlug: string;
  rowSelection?: RowSelectionResult;
};

export function IssueDataTable(props: IssueDataTableProps) {
  const columnHelper = createColumnHelper<IssueForDataTable>();

  const columns = [
    ...(props.rowSelection ? [createSelectionColumn<IssueForDataTable>()] : []),
    columnHelper.accessor("key", {
      header: "Key",
      meta: { shrink: true },
      cell: (info) => (
        <span class="px-1 py-0.5 whitespace-nowrap text-xs bg-muted text-muted-foreground rounded-sm border">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      meta: { shrink: true },
      cell: (info) => {
        const status = issueMappings.status[info.getValue()];
        return (
          <div
            class="flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <StatusPickerPopover
              status={info.getValue()}
              issueKey={info.row.original.key}
              trigger={<Dynamic component={status.icon} class={`${status.textClass} size-4`} />}
            />
          </div>
        );
      },
    }),
    columnHelper.accessor("summary", {
      header: "Summary",
      meta: { expand: true },
      cell: (info) => (
        <div class="flex flex-row items-center gap-2">
          <span class="truncate">{info.getValue()}</span>
          <Index each={info.row.original.labels}>
            {(label) => (
              <Badge size="sm" color={label().colorKey}>
                {label().name}
              </Badge>
            )}
          </Index>
        </div>
      ),
    }),
    columnHelper.accessor("issuePlan", {
      header: "Plan",
      meta: { shrink: true },
      cell: (info) => (
        <Show when={info.getValue()}>
          {(plan) => (
            <A
              href={`/${props.workspaceSlug}/team/${info.row.original.team?.key}/plans/${plan().id}`}
              class="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded-sm border whitespace-nowrap hover:bg-accent transition-colors"
              title={plan().name}
              onClick={(e) => e.stopPropagation()}
            >
              <LandPlotIcon class="size-3 shrink-0" />
              <span class="truncate max-w-20">{plan().name}</span>
            </A>
          )}
        </Show>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      meta: { shrink: true },
      cell: (info) => (
        <span class="text-muted-foreground ml-auto hidden sm:block">
          {formatDateShort(new Date(info.getValue()))}
        </span>
      ),
    }) as ColumnDef<IssueForDataTable, Date>,
  ];

  const datatableProps = createDataTable({
    // @ts-ignore TODO - fix column types
    columns,
    data: () => props.issues,
    getLinkProps: (row) => ({
      href: `/${props.workspaceSlug}/issue/${row.original.key}`,
    }),
    rowSelection: props.rowSelection,
    enableRowSelection: !!props.rowSelection,
    getRowId: (row) => row.id,
  });

  return <DataTableHeaderless {...datatableProps} />;
}

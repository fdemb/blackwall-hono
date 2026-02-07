import { flexRender, type Row, type Table as TableType } from "@tanstack/solid-table";
import {
  DataTableGrid,
  DataTableCell,
  DataTableRoot,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  DataTableLinkRow,
} from "./datatable-ui";
import { For } from "solid-js";
import { ScrollContainer } from "../custom-ui/scroll-area";
import type { createDataTable } from "./create-datatable";

type DataTableProps<TData> = ReturnType<typeof createDataTable<TData>>;

export function DataTable<TData>(props: DataTableProps<TData>) {
  return (
    <DataTableRoot>
      <DataTableHeaders {...props} />

      <ScrollContainer>
        <DataTableBody {...props} />
      </ScrollContainer>
    </DataTableRoot>
  );
}

export function DataTableHeaderless<TData>(props: DataTableProps<TData>) {
  return (
    <DataTableRoot>
      <ScrollContainer>
        <DataTableBody {...props} />
      </ScrollContainer>
    </DataTableRoot>
  );
}

export function DataTableHeaders<TData>(props: DataTableProps<TData>) {
  return (
    <DataTableGrid gridTemplateColumns={props.gridTemplateColumns()} class="shrink-0">
      <DataTableHead>
        <For each={props.table.getFlatHeaders()}>
          {(header) => (
            <DataTableHeader class={header.column.columnDef.meta?.headerClass}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </DataTableHeader>
          )}
        </For>
      </DataTableHead>
    </DataTableGrid>
  );
}

export function DataTableBody<TData>(props: DataTableProps<TData>) {
  return (
    <DataTableGrid gridTemplateColumns={props.gridTemplateColumns()}>
      <For each={props.table.getRowModel().rows}>{(row) => <DataRow row={row} />}</For>
    </DataTableGrid>
  );
}

type DataRowProps<TData> = {
  row: Row<TData>;
};

function DataRow<TData>(props: DataRowProps<TData>) {
  if (props.row.linkProps) {
    return (
      <DataTableLinkRow
        {...props.row.linkProps}
        data-state={props.row.getIsSelected() ? "selected" : undefined}
      >
        <For each={props.row.getVisibleCells()}>
          {(cell) => (
            <DataTableCell class={cell.column.columnDef.meta?.cellClass}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </DataTableCell>
          )}
        </For>
      </DataTableLinkRow>
    );
  }

  return (
    <DataTableRow data-state={props.row.getIsSelected() ? "selected" : undefined}>
      <For each={props.row.getVisibleCells()}>
        {(cell) => (
          <DataTableCell class={cell.column.columnDef.meta?.cellClass}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </DataTableCell>
        )}
      </For>
    </DataTableRow>
  );
}

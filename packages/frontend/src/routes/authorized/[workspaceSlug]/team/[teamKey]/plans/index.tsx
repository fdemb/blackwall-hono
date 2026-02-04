import { createAsync, useParams, A } from "@solidjs/router";
import { Show } from "solid-js";
import { plansLoader } from "./index.data";
import { useTeamData } from "../../[teamKey]";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { buttonVariants } from "@/components/ui/button";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import type { SerializedIssuePlan } from "@blackwall/database/schema";
import { createColumnHelper, type ColumnDef } from "@tanstack/solid-table";
import { formatDateShort } from "@/lib/dates";
import { createDataTable } from "@/components/datatable/create-datatable";
import { DataTable } from "@/components/datatable/datatable";

export default function PlansPage() {
  const params = useParams();
  const teamData = useTeamData();
  const plans = createAsync(() => plansLoader(params.teamKey!));

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
          <BreadcrumbsItem>Plans</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>

      <Show
        when={plans() && plans()!.length > 0}
        fallback={<PlanEmpty workspaceSlug={params.workspaceSlug!} teamKey={params.teamKey!} />}
      >
        <PlanTable
          plans={plans()!}
          workspaceSlug={params.workspaceSlug!}
          teamKey={params.teamKey!}
        />
      </Show>
    </>
  );
}

function PlanEmpty(props: { workspaceSlug: string; teamKey: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LandPlotIcon />
        </EmptyMedia>
        <EmptyTitle>No plans yet</EmptyTitle>
        <EmptyDescription>
          Plans help you organize and track work over time. Create your first plan to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <A
          href={`/${props.workspaceSlug}/team/${props.teamKey}/plans/create`}
          class={buttonVariants()}
        >
          Create plan
        </A>
      </EmptyContent>
    </Empty>
  );
}

type PlanTableProps = {
  plans: SerializedIssuePlan[];
  workspaceSlug: string;
  teamKey: string;
};

function PlanTable(props: PlanTableProps) {
  const columnHelper = createColumnHelper<SerializedIssuePlan>();

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("goal", {
      header: "Goal",
      meta: { expand: true },
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("startDate", {
      header: "Start date",
      cell: (info) => formatDateShort(new Date(info.getValue())),
    }) as ColumnDef<SerializedIssuePlan, string>,
    columnHelper.accessor("endDate", {
      header: "End date",
      cell: (info) => formatDateShort(new Date(info.getValue())),
    }) as ColumnDef<SerializedIssuePlan, string>,
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <A
          class={buttonVariants({ variant: "ghost", size: "xs" })}
          href={`/${props.workspaceSlug}/team/${props.teamKey}/plans/${info.row.original.id}/edit`}
          onClick={(e) => e.stopPropagation()}
        >
          Edit
        </A>
      ),
    }),
  ];

  const datatableProps = createDataTable({
    columns,
    data: () => props.plans,
    getLinkProps(row) {
      return {
        href: `/${props.workspaceSlug}/team/${props.teamKey}/plans/${row.original.id}`,
      };
    },
  });

  return <DataTable {...datatableProps} />;
}

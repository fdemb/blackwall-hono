import { action, createAsync, redirect, useAction, useNavigate, useParams, A } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
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
import { api } from "@/lib/api";
import { toast } from "@/components/custom-ui/toast";
import { PlanStatusBadge } from "@/components/plans/plan-status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MoreHorizontalIcon from "lucide-solid/icons/more-horizontal";
import { Button } from "@/components/ui/button";

const archivePlanAction = action(async (workspaceSlug: string, teamKey: string, planId: string) => {
  await api.api["issue-plans"].teams[":teamKey"].plans[":planId"].$delete({
    param: { teamKey, planId },
  });

  toast.success("Plan archived");
  throw redirect(`/${workspaceSlug}/team/${teamKey}/plans`);
});

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
  const teamData = useTeamData();
  const navigate = useNavigate();
  const archiveAction = useAction(archivePlanAction);
  const [archiveDialogOpen, setArchiveDialogOpen] = createSignal(false);
  const [selectedPlan, setSelectedPlan] = createSignal<SerializedIssuePlan | null>(null);

  const columns = [
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: (info) => (
        <PlanStatusBadge plan={info.row.original} activePlanId={teamData().activePlanId} />
      ),
    }),
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
      cell: (info) => {
        const plan = info.row.original;
        const isActive = teamData().activePlanId === plan.id;
        const isCompleted = Boolean(plan.finishedAt);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              as={Button}
              variant="ghost"
              size="iconXs"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontalIcon class="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() =>
                  navigate(`/${props.workspaceSlug}/team/${props.teamKey}/plans/${plan.id}`)
                }
              >
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  navigate(`/${props.workspaceSlug}/team/${props.teamKey}/plans/${plan.id}/edit`)
                }
                disabled={isCompleted}
              >
                Edit
              </DropdownMenuItem>
              <Show when={isActive && !isCompleted}>
                <DropdownMenuItem
                  onSelect={() =>
                    navigate(
                      `/${props.workspaceSlug}/team/${props.teamKey}/plans/${plan.id}/complete`,
                    )
                  }
                >
                  Complete plan
                </DropdownMenuItem>
              </Show>
              <Show when={!isActive}>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    setSelectedPlan(plan);
                    setArchiveDialogOpen(true);
                  }}
                >
                  Archive
                </DropdownMenuItem>
              </Show>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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

  return (
    <>
      <DataTable {...datatableProps} />
      <AlertDialog open={archiveDialogOpen()} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia class="bg-destructive/50" />
            <AlertDialogTitle>Archive this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the plan and unassigns any issues still attached to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              size="xs"
              variant="destructive"
              action={() =>
                selectedPlan()
                  ? archiveAction(props.workspaceSlug, props.teamKey, selectedPlan()!.id)
                  : Promise.resolve()
              }
            >
              Archive plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

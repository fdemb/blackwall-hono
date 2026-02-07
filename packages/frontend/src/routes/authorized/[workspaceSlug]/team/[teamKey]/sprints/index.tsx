import {
  action,
  createAsync,
  redirect,
  useAction,
  useNavigate,
  useParams,
  A,
} from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import { sprintsLoader } from "./index.data";
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
import type { SerializedIssueSprint } from "@blackwall/database/schema";
import { createColumnHelper, type ColumnDef } from "@tanstack/solid-table";
import { formatDateShort } from "@/lib/dates";
import { createDataTable } from "@/components/datatable/create-datatable";
import { DataTable } from "@/components/datatable/datatable";
import { api } from "@/lib/api";
import { toast } from "@/components/custom-ui/toast";
import { SprintStatusBadge } from "@/components/sprints/sprint-status-badge";
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

const archiveSprintAction = action(async (workspaceSlug: string, teamKey: string, sprintId: string) => {
  await api.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].$delete({
    param: { teamKey, sprintId },
  });

  toast.success("Sprint archived");
  throw redirect(`/${workspaceSlug}/team/${teamKey}/sprints`);
});

export default function SprintsPage() {
  const params = useParams();
  const teamData = useTeamData();
  const sprints = createAsync(() => sprintsLoader(params.teamKey!));

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
          <BreadcrumbsItem>Sprints</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>

      <Show
        when={sprints() && sprints()!.length > 0}
        fallback={<SprintEmpty workspaceSlug={params.workspaceSlug!} teamKey={params.teamKey!} />}
      >
        <SprintTable
          sprints={sprints()!}
          workspaceSlug={params.workspaceSlug!}
          teamKey={params.teamKey!}
        />
      </Show>
    </>
  );
}

function SprintEmpty(props: { workspaceSlug: string; teamKey: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LandPlotIcon />
        </EmptyMedia>
        <EmptyTitle>No sprints yet</EmptyTitle>
        <EmptyDescription>
          Sprints help you organize and track work over time. Create your first sprint to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <A
          href={`/${props.workspaceSlug}/team/${props.teamKey}/sprints/create`}
          class={buttonVariants()}
        >
          Create sprint
        </A>
      </EmptyContent>
    </Empty>
  );
}

type SprintTableProps = {
  sprints: SerializedIssueSprint[];
  workspaceSlug: string;
  teamKey: string;
};

function SprintTable(props: SprintTableProps) {
  const columnHelper = createColumnHelper<SerializedIssueSprint>();
  const teamData = useTeamData();
  const navigate = useNavigate();
  const archiveAction = useAction(archiveSprintAction);
  const [archiveDialogOpen, setArchiveDialogOpen] = createSignal(false);
  const [selectedSprint, setSelectedSprint] = createSignal<SerializedIssueSprint | null>(null);

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
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: (info) => (
        <SprintStatusBadge sprint={info.row.original} activeSprintId={teamData().activeSprintId} />
      ),
    }),
    columnHelper.accessor("startDate", {
      header: "Start date",
      cell: (info) => formatDateShort(new Date(info.getValue())),
    }) as ColumnDef<SerializedIssueSprint, string>,
    columnHelper.accessor("endDate", {
      header: "End date",
      cell: (info) => formatDateShort(new Date(info.getValue())),
    }) as ColumnDef<SerializedIssueSprint, string>,
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const sprint = info.row.original;
        const isActive = teamData().activeSprintId === sprint.id;
        const isCompleted = Boolean(sprint.finishedAt);

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
                  navigate(`/${props.workspaceSlug}/team/${props.teamKey}/sprints/${sprint.id}`)
                }
              >
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  navigate(`/${props.workspaceSlug}/team/${props.teamKey}/sprints/${sprint.id}/edit`)
                }
                disabled={isCompleted}
              >
                Edit
              </DropdownMenuItem>
              <Show when={isActive && !isCompleted}>
                <DropdownMenuItem
                  onSelect={() =>
                    navigate(
                      `/${props.workspaceSlug}/team/${props.teamKey}/sprints/${sprint.id}/complete`,
                    )
                  }
                >
                  Complete sprint
                </DropdownMenuItem>
              </Show>
              <Show when={!isActive}>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    setSelectedSprint(sprint);
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
    data: () => props.sprints,
    getLinkProps(row) {
      return {
        href: `/${props.workspaceSlug}/team/${props.teamKey}/sprints/${row.original.id}`,
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
            <AlertDialogTitle>Archive this sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the sprint and unassigns any issues still attached to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              size="xs"
              variant="destructive"
              action={() =>
                selectedSprint()
                  ? archiveAction(props.workspaceSlug, props.teamKey, selectedSprint()!.id)
                  : Promise.resolve()
              }
            >
              Archive sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

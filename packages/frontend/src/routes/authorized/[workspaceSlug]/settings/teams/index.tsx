import { TeamAvatar } from "@/components/custom-ui/avatar";
import { createDataTable } from "@/components/datatable/create-datatable";
import { DataTable } from "@/components/datatable/datatable";
import { SettingsPage, SettingsSection } from "@/components/settings/settings-sections";
import { buttonVariants } from "@/components/ui/button";
import { formatDateShort } from "@/lib/dates";
import { createColumnHelper } from "@tanstack/solid-table";
import { A, createAsync, useParams } from "@solidjs/router";
import { teamsSettingsLoader } from "./index.data";
import type { SerializedTeam } from "@blackwall/database/schema";

type TeamWithCounts = {
  team: SerializedTeam;
  usersCount: number;
  issuesCount: number;
};

export default function TeamsSettingsPage() {
  const params = useParams();

  return (
    <SettingsPage title="Team management" fullWidth>
      <SettingsSection
        title="Teams"
        rightContent={
          <A
            class={buttonVariants({ variant: "default", size: "sm" })}
            href={`/${params.workspaceSlug}/settings/teams/create`}
          >
            Create team
          </A>
        }
      >
        <TeamTable />
      </SettingsSection>
    </SettingsPage>
  );
}

function TeamTable() {
  const params = useParams();
  const teamsData = createAsync(() => teamsSettingsLoader());
  const teams = () => (teamsData() ?? []) as TeamWithCounts[];

  const columnHelper = createColumnHelper<TeamWithCounts>();

  const columns = [
    columnHelper.accessor((row) => row.team.name, {
      id: "name",
      header: "Name",
      meta: {
        expand: true
      },
      cell: (info) => (
        <div class="flex items-center gap-2 font-medium">
          <TeamAvatar team={info.row.original.team} size="5" />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.team.key, {
      id: "key",
      header: "Key",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("usersCount", {
      header: "Members",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("issuesCount", {
      header: "Issues",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => row.team.createdAt, {
      id: "createdAt",
      header: "Created",
      cell: (info) => formatDateShort(new Date(info.getValue())),
    }),
  ];

  const datatableProps = createDataTable({
    columns,
    data: teams,
    getLinkProps(row) {
      return {
        href: `/${params.workspaceSlug}/settings/teams/${row.original.team.key}`,
      };
    },
  });

  return <DataTable {...datatableProps} />;
}

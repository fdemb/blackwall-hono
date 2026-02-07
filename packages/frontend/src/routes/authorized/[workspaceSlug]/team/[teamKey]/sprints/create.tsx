import { useParams } from "@solidjs/router";
import { useTeamData } from "../../[teamKey]";
import { SprintForm } from "@/components/sprints/sprint-form";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";

export default function CreateSprintPage() {
  const params = useParams();
  const teamData = useTeamData();

  return (
    <>
      <PageHeader>
        <Breadcrumbs>
          <BreadcrumbsItem
            linkProps={{
              href: `/${params.workspaceSlug}/team/${params.teamKey}/issues`,
            }}
          >
            <div class="flex flex-row items-center gap-1">
              <TeamAvatar team={teamData()} size="5" />
              {teamData().name}
            </div>
          </BreadcrumbsItem>
          <BreadcrumbsItem>Create sprint</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>

      <ScrollContainer>
        <SprintForm
          workspaceSlug={params.workspaceSlug!}
          teamKey={params.teamKey!}
          team={teamData()}
          title={`Create sprint for ${teamData().name}`}
          buttonText="Create sprint"
        />
      </ScrollContainer>
    </>
  );
}

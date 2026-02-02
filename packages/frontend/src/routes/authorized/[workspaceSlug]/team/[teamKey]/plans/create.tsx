import { useParams } from "@solidjs/router";
import { useTeamData } from "../../[teamKey]";
import { PlanForm } from "@/components/plans/plan-form";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";

export default function CreatePlanPage() {
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
          <BreadcrumbsItem>Create plan</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>

      <ScrollContainer>
        <PlanForm
          workspaceSlug={params.workspaceSlug!}
          teamKey={params.teamKey!}
          team={teamData()}
          title={`Create plan for ${teamData().name}`}
          buttonText="Create plan"
        />
      </ScrollContainer>
    </>
  );
}

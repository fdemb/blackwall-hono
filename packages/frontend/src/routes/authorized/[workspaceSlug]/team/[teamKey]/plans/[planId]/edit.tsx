import { createAsync, useParams, A } from "@solidjs/router";
import { Show } from "solid-js";
import { planDetailLoader } from "./index.data";
import { useTeamData } from "../../../[teamKey]";
import { EditPlanForm } from "@/components/plans/edit-plan-form";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";

export default function EditPlanPage() {
  const params = useParams();
  const teamData = useTeamData();
  const data = createAsync(() => planDetailLoader(params.teamKey!, params.planId!));
  const plan = () => data()?.plan;

  return (
    <Show when={plan()}>
      <>
        <PageHeader>
          <Breadcrumbs>
            <BreadcrumbsItem
              linkProps={{
                href: `/${params.workspaceSlug}/team/${params.teamKey}/issues/board`,
              }}
            >
              <div class="flex flex-row items-center gap-1">
                <TeamAvatar team={teamData()} size="5" />
                {teamData().name}
              </div>
            </BreadcrumbsItem>
            <BreadcrumbsItem
              linkProps={{ href: `/${params.workspaceSlug}/team/${params.teamKey}/plans` }}
            >
              Plans
            </BreadcrumbsItem>
            <BreadcrumbsItem
              linkProps={{
                href: `/${params.workspaceSlug}/team/${params.teamKey}/plans/${params.planId}`,
              }}
            >
              {plan()!.name}
            </BreadcrumbsItem>
            <BreadcrumbsItem>Edit</BreadcrumbsItem>
          </Breadcrumbs>
        </PageHeader>

        <ScrollContainer>
          <EditPlanForm
            workspaceSlug={params.workspaceSlug!}
            teamKey={params.teamKey!}
            team={teamData()}
            plan={plan()!}
          />
        </ScrollContainer>
      </>
    </Show>
  );
}

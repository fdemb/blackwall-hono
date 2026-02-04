import { createAsync, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { planDetailLoader } from "./index.data";
import { useTeamData } from "../../../[teamKey]";
import { CompletePlanForm } from "@/components/plans/complete-plan-form";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";

export default function CompletePlanPage() {
  const params = useParams();
  const teamData = useTeamData();
  const data = createAsync(() => planDetailLoader(params.teamKey!, params.planId!));

  return (
    <Show when={data()} fallback={null}>
      {(planData) => (
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
              <BreadcrumbsItem>Complete plan</BreadcrumbsItem>
            </Breadcrumbs>
          </PageHeader>

          <ScrollContainer>
            <CompletePlanForm
              workspaceSlug={params.workspaceSlug!}
              teamKey={params.teamKey!}
              team={teamData()}
              plan={planData().plan}
            />
          </ScrollContainer>
        </>
      )}
    </Show>
  );
}

import { createAsync, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { sprintDetailLoader } from "./index.data";
import { useTeamData } from "../../../[teamKey]";
import { CompleteSprintForm } from "@/components/sprints/complete-sprint-form";
import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";

export default function CompleteSprintPage() {
  const params = useParams();
  const teamData = useTeamData();
  const data = createAsync(() => sprintDetailLoader(params.teamKey!, params.sprintId!));

  return (
    <Show when={data()} fallback={null}>
      {(sprintData) => (
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
              <BreadcrumbsItem>Complete sprint</BreadcrumbsItem>
            </Breadcrumbs>
          </PageHeader>

          <ScrollContainer>
            <CompleteSprintForm
              workspaceSlug={params.workspaceSlug!}
              teamKey={params.teamKey!}
              team={teamData()}
              sprint={sprintData().sprint}
            />
          </ScrollContainer>
        </>
      )}
    </Show>
  );
}

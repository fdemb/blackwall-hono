import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";
import { UserAvatar } from "@/components/custom-ui/avatar";
import { Badge } from "@/components/custom-ui/badge";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-sections";
import { useSessionData } from "@/context/session-context";
import { createAsync, useParams, A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { memberDetailLoader } from "./[userId].data";

export default function MemberDetailPage() {
  const params = useParams();
  const session = useSessionData();
  const member = createAsync(() => memberDetailLoader(params.workspaceSlug!, params.userId!));
  const isCurrentUser = () => member()?.id === session().user.id;

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <>
      <PageHeader>
        <Breadcrumbs>
          <BreadcrumbsItem
            linkProps={{
              href: `/${params.workspaceSlug}/members`,
            }}
          >
            Members
          </BreadcrumbsItem>
          <BreadcrumbsItem>{member()?.name ?? "Member"}</BreadcrumbsItem>
        </Breadcrumbs>
      </PageHeader>
      <ScrollContainer>
        <Show when={member()}>
          {(m) => (
            <div class="flex flex-col gap-6 w-full max-w-3xl mx-auto pt-12">
              <div class="flex items-center gap-4 px-6">
                <UserAvatar user={m()} size="lg" />
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-2">
                    <h1 class="text-2xl font-medium truncate">{m().name}</h1>
                    <Show when={isCurrentUser()}>
                      <Badge>You</Badge>
                    </Show>
                  </div>
                  <Show when={m().email}>
                    <span class="text-sm text-muted-foreground truncate">{m().email}</span>
                  </Show>
                </div>
              </div>

              <SettingsSection title="Details">
                <SettingsCard>
                  <Show when={m().email}>
                    <SettingsRow title="Email">
                      <a href={`mailto:${m().email}`} class="text-sm hover:underline">
                        {m().email}
                      </a>
                    </SettingsRow>
                  </Show>
                  <SettingsRow title="Joined">
                    <span class="text-sm">{formatDate(m().createdAt)}</span>
                  </SettingsRow>
                </SettingsCard>
              </SettingsSection>

              <SettingsSection title="Teams">
                <SettingsCard>
                  <Show
                    when={m().teams && m().teams.length > 0}
                    fallback={
                      <div class="px-4 py-3.5">
                        <p class="text-sm text-muted-foreground">Not a member of any teams yet.</p>
                      </div>
                    }
                  >
                    <div class="px-4 py-3.5 flex flex-wrap gap-2">
                      <For each={m().teams}>
                        {(team) => (
                          <A
                            href={`/${params.workspaceSlug}/team/${team.key}/issues/board`}
                            class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-accent hover:bg-accent/80 transition-colors"
                          >
                            {team.name}
                          </A>
                        )}
                      </For>
                    </div>
                  </Show>
                </SettingsCard>
              </SettingsSection>
            </div>
          )}
        </Show>
      </ScrollContainer>
    </>
  );
}

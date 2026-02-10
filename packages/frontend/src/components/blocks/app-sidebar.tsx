import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useWorkspaceData } from "@/context/workspace-context";
import AlertCircleIcon from "lucide-solid/icons/alert-circle";
import ChevronRightIcon from "lucide-solid/icons/chevron-right";
import Users2Icon from "lucide-solid/icons/users-2";
import ListTodoIcon from "lucide-solid/icons/list-todo";
import CircleDashedIcon from "lucide-solid/icons/circle-dashed";
import KanbanIcon from "lucide-solid/icons/kanban-square";
import LandPlotIcon from "lucide-solid/icons/land-plot";
import type { Component, ComponentProps } from "solid-js";
import { For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import { TeamAvatar } from "../custom-ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { CreateDialog } from "./create-dialog";
// import { GlobalSearchDialog } from "./global-search-dialog";
import { LogoNoBg } from "./logos";
import { UserMenu } from "./user-menu";
// import { WorkspacePicker } from "./workspace-picker";
import { WorkspacePicker } from "./workspace-picker";
import { GlobalSearchDialog } from "./global-search-dialog";
import { FastLink } from "../custom-ui/fast-link";

type LinkNavItem = {
  title: string;
  type: "link";
  href: string;
  icon?: Component;
};

type CollapsibleNavItem = {
  id: string; // for remembering the open state
  title: string;
  type: "collapsible";
  icon?: Component;
  children: LinkNavItem[];
};

type NavItem = LinkNavItem | CollapsibleNavItem;

type NavGroup = {
  title?: string;
  children: NavItem[];
};

function createNavItems(): () => NavGroup[] {
  const workspaceData = useWorkspaceData();
  const teams = () => workspaceData().teams;

  return () => [
    {
      children: [
        {
          title: "My issues",
          type: "link",
          icon: ListTodoIcon,
          href: `/${workspaceData().workspace.slug}/my-issues`,
        },
        {
          title: "Members",
          type: "link",
          href: `/${workspaceData().workspace.slug}/members`,
          icon: Users2Icon,
        },
      ],
    },
    {
      title: "Teams",
      children: teams().map((team) => ({
        id: `team-${team.key}`,
        title: team.name,
        type: "collapsible",
        icon: () => <TeamAvatar team={team} size="5" />,
        children: [
          {
            title: "Backlog",
            type: "link",
            href: `/${workspaceData().workspace.slug}/team/${team.key}/issues/backlog`,
            icon: CircleDashedIcon,
          },
          {
            title: "Issues",
            type: "link",
            href: `/${workspaceData().workspace.slug}/team/${team.key}/issues/active`,
            icon: AlertCircleIcon,
          },
          {
            title: "Board",
            type: "link",
            href: `/${workspaceData().workspace.slug}/team/${team.key}/issues/board`,
            icon: KanbanIcon,
          },
          {
            title: "Sprints",
            type: "link",
            href: `/${workspaceData().workspace.slug}/team/${team.key}/sprints`,
            icon: LandPlotIcon,
          },
        ],
      })),
    },
  ];
}

function useLocalStorageCollapsibleState() {
  const [store, internal_setStore] = createStore<Record<string, boolean>>({});

  onMount(() => {
    const state = localStorage.getItem("sidebar:collapsible-open-state");
    if (state) {
      internal_setStore(JSON.parse(state));
    }
  });

  const setStore = (key: string, value: boolean) => {
    internal_setStore(key, value);

    localStorage.setItem("sidebar:collapsible-open-state", JSON.stringify(store));
  };

  return [store, setStore] as const;
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const workspaceData = useWorkspaceData();
  const groups = createNavItems();
  const [collapsibleStateStore, setCollapsibleStateStore] = useLocalStorageCollapsibleState();


  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div class="flex items-center gap-1 text-lg leading-none font-medium p-1">
          <LogoNoBg class="size-6 shrink-0 mr-1 text-primary" />
          <span>/</span>
          <WorkspacePicker />
        </div>

        <div class="flex flex-row gap-2">
          <CreateDialog global />

          <GlobalSearchDialog workspaceSlug={workspaceData().workspace.slug} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <For each={groups()}>
          {(group) => (
            <SidebarGroup>
              <Show when={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              </Show>
              <SidebarGroupContent>
                <SidebarMenu>
                  <For each={group.children}>
                    {(item) => (
                      <SidebarMenuItem>
                        <Show when={item.type === "link" ? item : false}>
                          {(item) => (
                            <SidebarMenuButton as={FastLink} href={item().href}>
                              <Show when={item().icon}>
                                <Dynamic component={item().icon} />
                              </Show>
                              {item().title}
                            </SidebarMenuButton>
                          )}
                        </Show>

                        <Show when={item.type === "collapsible" ? item : false}>
                          {(item) => (
                            <>
                              <Collapsible
                                class="group/collapsible"
                                open={collapsibleStateStore[item().id]}
                                onOpenChange={(open) => setCollapsibleStateStore(item().id, open)}
                              >
                                <CollapsibleTrigger as={SidebarMenuButton}>
                                  <Show when={item().icon}>
                                    <Dynamic component={item().icon} />
                                  </Show>
                                  {item().title}
                                  <ChevronRightIcon class="ml-auto transition-transform duration-200 group-data-expanded/collapsible:rotate-90 size-6" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <SidebarMenuSub>
                                    <For each={item().children}>
                                      {(child) => (
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton
                                            as={FastLink}
                                            href={child.href}

                                          >
                                            <Show when={child.icon}>
                                              <Dynamic component={child.icon} />
                                            </Show>
                                            {child.title}
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                      )}
                                    </For>
                                  </SidebarMenuSub>
                                </CollapsibleContent>
                              </Collapsible>
                            </>
                          )}
                        </Show>
                      </SidebarMenuItem>
                    )}
                  </For>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </For>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

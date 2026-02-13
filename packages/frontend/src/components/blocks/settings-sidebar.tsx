import { buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { TextField } from "@/components/ui/text-field";
import { useWorkspaceData } from "@/context/workspace-context";
import { m } from "@/paraglide/messages.js";
import { A } from "@solidjs/router";
import ArrowLeftIcon from "lucide-solid/icons/arrow-left";
import SearchIcon from "lucide-solid/icons/search";
import type { ComponentProps } from "solid-js";
import { FastLink } from "../custom-ui/fast-link";

export function SettingsSidebar(props: ComponentProps<typeof Sidebar>) {
  const workspaceData = useWorkspaceData();


  return (
    <Sidebar {...props}>
      <SidebarHeader class="flex flex-col gap-2">
        <A
          href="/"
          class={buttonVariants({
            variant: "ghost",
            size: "xs",
            class: "w-fit",
          })}
        >
          <ArrowLeftIcon class="size-4" />
          {m.settings_sidebar_back_to_workspace({ workspaceName: workspaceData().workspace.displayName })}
        </A>

        <TextField class="relative">
          <div class="absolute h-full pl-2 top-0 bottom-0 left-0 flex items-center justify-center">
            <SearchIcon class="size-4 text-muted-foreground" />
          </div>
          <TextField.Input placeholder={m.settings_sidebar_search_placeholder()} class="pl-7" />
        </TextField>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  as={FastLink}
                  href={`/${workspaceData().workspace.slug}/settings/general`}

                >
                  {m.settings_sidebar_menu_general()}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as={FastLink}
                  href={`/${workspaceData().workspace.slug}/settings/profile`}

                >
                  {m.settings_sidebar_menu_profile()}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as={FastLink}
                  href={`/${workspaceData().workspace.slug}/settings/workspace`}

                >
                  {m.settings_sidebar_menu_workspace()}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as={FastLink}
                  href={`/${workspaceData().workspace.slug}/settings/teams`}

                >
                  {m.settings_sidebar_menu_team_management()}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

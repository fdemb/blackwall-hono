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
          Back to {workspaceData().workspace.displayName}
        </A>

        <TextField class="relative">
          <div class="absolute h-full pl-2 top-0 bottom-0 left-0 flex items-center justify-center">
            <SearchIcon class="size-4 text-muted-foreground" />
          </div>
          <TextField.Input placeholder="Search settings..." class="pl-7" />
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
                  General
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as={FastLink}
                  href={`/${workspaceData().workspace.slug}/settings/profile`}
                >
                  Profile
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as={FastLink}
                  href={`/${workspaceData().workspace.slug}/settings/workspace`}
                >
                  Workspace
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  as={FastLink}
                  href={`/${workspaceData().workspace.slug}/settings/teams`}
                >
                  Team management
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

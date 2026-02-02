import { SettingsSidebar } from "@/components/blocks/settings-sidebar";
import { ScrollContainer } from "@/components/custom-ui/scroll-area";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { ParentComponent } from "solid-js";

const SettingsLayout: ParentComponent = (props) => {
  return (
    <SidebarProvider>
      <SettingsSidebar />
      <ScrollContainer class="bg-background">
        {props.children}
      </ScrollContainer>
    </SidebarProvider>
  );
};

export default SettingsLayout;

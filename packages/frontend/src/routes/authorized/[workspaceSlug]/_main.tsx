import { AppSidebar } from "@/components/blocks/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { ParentComponent } from "solid-js";

const MainLayout: ParentComponent = (props) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main class="relative flex min-h-0 h-full w-full flex-1 flex-col bg-background overflow-hidden">
        {props.children}
      </main>
    </SidebarProvider>
  );
};

export default MainLayout;

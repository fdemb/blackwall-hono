import { AppSidebar } from "@/components/blocks/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CreateDialogProvider } from "@/context/create-dialog.context";
import { Suspense, type ParentComponent } from "solid-js";

const MainLayout: ParentComponent = (props) => {
  return (
    <SidebarProvider mobileBreakpoint={1024}>
      <CreateDialogProvider>
        <AppSidebar />
        <main class="relative flex min-h-0 h-full w-full flex-1 flex-col bg-background overflow-hidden">
          <Suspense>
            {props.children}
          </Suspense>
        </main>
      </CreateDialogProvider>
    </SidebarProvider>
  );
};

export default MainLayout;

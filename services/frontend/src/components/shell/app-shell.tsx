import type { PropsWithChildren } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <Topbar />
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

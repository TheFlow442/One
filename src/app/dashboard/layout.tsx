import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarContent } from "@/components/dashboard/sidebar-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

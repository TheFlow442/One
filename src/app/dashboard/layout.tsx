import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarNavContent } from "@/components/dashboard/sidebar-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNavContent />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";

import {
  LayoutGrid,
  Cpu,
  FileText,
  AlertTriangle,
  Settings,
  Users,
  Sun,
  Home
} from "lucide-react";
import { usePathname } from "next/navigation";

export function SidebarNavContent() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        // The root path should only be active if it's exactly the root.
        if (path === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(path);
    }

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-4">
            <Home className="h-6 w-6"/>
            <h1 className="text-xl font-bold">Smart Solar Microgrid</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton href="/" isActive={isActive('/')}>
              <LayoutGrid />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="/systems" isActive={isActive('/systems')}>
              <Cpu />
              Systems
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="/reports" isActive={isActive('/reports')}>
              <FileText />
              Reports
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="/alerts" isActive={isActive('/alerts')}>
              <AlertTriangle />
              Alerts
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="/settings" isActive={isActive('/settings')}>
              <Settings />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu className="mt-4">
          <p className="px-4 text-sm font-semibold text-muted-foreground">Communities</p>
          <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive={isActive('/community-a')} className="mt-2">
                  <Users />
                  Community A
              </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive={isActive('/community-b')}>
                  <Users />
                  Community B
              </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive={isActive('/community-c')}>
                  <Users />
                  Community C
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

      </SidebarContent>
      <SidebarFooter>
        <Card className="m-2 shadow-none">
            <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">Today Generation</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <Sun className="h-5 w-5 text-yellow-500"/>
                    <p className="text-2xl font-bold">876 <span className="text-lg font-normal text-muted-foreground">kWh</span></p>
                </div>
            </CardContent>
        </Card>
      </SidebarFooter>
    </>
  );
}

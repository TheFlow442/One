
"use client";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
  History,
  Zap
} from "lucide-react";
import Link from 'next/link';
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
            <Link href="/" className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">VoltaView</h1>
            </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
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
            <SidebarMenuItem>
              <SidebarMenuButton href="/history" isActive={isActive('/history')}>
                <History />
                History
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/esp32" isActive={isActive('/esp32')}>
                <Cpu />
                ESP32 Connect
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          
          <div className="mt-4 flex flex-col gap-4">
            <SidebarMenu>
              <p className="px-4 text-sm font-semibold text-muted-foreground">Communities</p>
              <SidebarMenuItem>
                  <SidebarMenuButton href="/community-a" isActive={isActive('/community-a')} className="mt-2">
                      <Users />
                      Community A
                  </SidebarMenuButton>
              </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/community-b" isActive={isActive('/community-b')}>
                      <Users />
                      Community B
                  </SidebarMenuButton>
              </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/community-c" isActive={isActive('/community-c')}>
                      <Users />
                      Community C
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          <Card className="m-2 mt-auto shadow-none bg-accent/50">
              <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground">Today Generation</p>
                  <div className="flex items-baseline gap-2 mt-1">
                      <Sun className="h-5 w-5 text-yellow-500"/>
                      <p className="text-2xl font-bold">802.65 <span className="text-lg font-normal text-muted-foreground">kWh</span></p>
                  </div>
              </CardContent>
          </Card>
      </SidebarContent>
    </>
  );
}

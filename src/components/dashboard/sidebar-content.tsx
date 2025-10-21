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
  History,
  Home
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-6 w-6">
                    <rect width="256" height="256" fill="none"></rect>
                    <path d="M148,168V200a8,8,0,0,1-16,0V168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path><path d="M196,120H156l12-32-64,72h40l-12,32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path><path d="M104.9,131.1a60,60,0,1,1,26.2-83.3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                </svg>
                <h1 className="text-xl font-bold">VoltaView</h1>
            </Link>
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
           <SidebarMenuItem>
            <SidebarMenuButton href="/history" isActive={isActive('/history')}>
              <History />
              History
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
                    <p className="text-2xl font-bold">802.65 <span className="text-lg font-normal text-muted-foreground">kWh</span></p>
                </div>
            </CardContent>
        </Card>
      </SidebarFooter>
    </>
  );
}

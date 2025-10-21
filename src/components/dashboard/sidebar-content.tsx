"use client";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Cpu,
  FileText,
  AlertTriangle,
  Settings,
  History,
  Users,
  BoltIcon,
  LogOutIcon
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

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
        <div className="flex items-center gap-2 p-2">
            <BoltIcon className="h-6 w-6 text-primary"/>
            <h1 className="text-xl font-bold">VoltaView</h1>
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
            <SidebarMenuButton href="#" isActive={isActive('/systems')}>
              <Cpu />
              Systems
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive={isActive('/reports')}>
              <FileText />
              Reports
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive={isActive('/alerts')}>
              <AlertTriangle />
              Alerts
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive={isActive('/settings')}>
              <Settings />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton href="#" isActive={isActive('/history')}>
              <History />
              History
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarGroup>
            <SidebarGroupLabel>Communities</SidebarGroupLabel>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton href="#" isActive={isActive('/community-a')}>
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
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <Button variant="outline" className="w-full" disabled>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </>
  );
}

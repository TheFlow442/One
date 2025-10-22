
"use client";
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  LayoutGrid,
  Users,
  LogOut,
  Shield,
} from "lucide-react";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { logout } from "@/lib/actions";

export function AdminSidebarNavContent() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname.startsWith(path);
    }

  return (
    <>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-4">
            <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Admin Panel</h1>
            </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/admin" isActive={isActive('/admin')}>
                <LayoutGrid />
                Admin Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard">
                <Users />
                User View
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarContent>
        <SidebarFooter>
            <form action={logout}>
                <Button variant="ghost" className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </form>
      </SidebarFooter>
    </>
  );
}

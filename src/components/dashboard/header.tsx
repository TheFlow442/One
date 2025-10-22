
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
        <div className="md:hidden">
            <SidebarTrigger asChild>
                <Button variant="ghost">
                    <PanelLeft />
                    <span className="ml-2">Menu</span>
                </Button>
            </SidebarTrigger>
        </div>


       <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary"/>
            <h1 className="text-xl font-bold">VoltaView</h1>
          </Link>
        </div>
    </header>
  );
}

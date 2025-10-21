"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Home } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      <SidebarTrigger className="md:hidden" />

       <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6"/>
            <h1 className="text-xl font-bold">VoltaView</h1>
          </Link>
        </div>

       <div className="w-full flex-1 md:w-auto md:flex-initial ml-auto flex items-center gap-4">
        </div>
    </header>
  );
}

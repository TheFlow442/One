"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BoltIcon } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <BoltIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">VoltaView</h1>
        </div>
      </div>
      <Avatar>
        <AvatarImage src="https://picsum.photos/seed/user/40/40" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </header>
  );
}

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
        
      </div>
      <Avatar>
        <AvatarImage src="https://picsum.photos/seed/user/40/40" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </header>
  );
}

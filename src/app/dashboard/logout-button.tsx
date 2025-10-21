'use client';

import { logout } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { LogOutIcon } from 'lucide-react';

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="outline" className="w-full">
        <LogOutIcon className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </form>
  );
}

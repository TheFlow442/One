
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/settings/theme-switcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/firebase/provider';
import { User, LogOut, Bell, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user, isUserLoading } = useUser();

  const handleLogout = async () => {
    // In a real app, you'd call your Firebase auth sign-out function here.
    // For now, it's just a placeholder.
    alert('Logged out!');
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and app settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User /> Profile</CardTitle>
          <CardDescription>This is how your profile appears to others.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} alt="User Avatar" />
              <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <Button variant="outline">Change Picture</Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={isUserLoading ? 'Loading...' : user?.email || 'No email associated'} readOnly disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" placeholder="Enter your display name" defaultValue={user?.displayName || ''} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell /> Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
                <div>
                    <Label htmlFor="critical-alerts" className="font-semibold">Critical Alerts</Label>
                    <p className="text-sm text-muted-foreground">e.g., Inverter failure, grid outage.</p>
                </div>
                <Switch id="critical-alerts" defaultChecked />
            </div>
             <div className="flex items-center justify-between p-4 rounded-lg bg-background border">
                <div>
                    <Label htmlFor="system-warnings" className="font-semibold">System Warnings</Label>
                    <p className="text-sm text-muted-foreground">e.g., High battery temperature, low generation.</p>
                </div>
                <Switch id="system-warnings" />
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogOut /> Account</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
            <Button variant="outline" onClick={handleLogout} className="self-start">
              Log Out
            </Button>
            <Separator />
             <div className="p-4 border border-destructive/50 rounded-lg">
                <h4 className="font-semibold text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mt-1 mb-4">These actions are permanent and cannot be undone.</p>
                <Button variant="destructive">Delete Account</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from "next-themes"
import { firebaseConfig } from '@/firebase/config';
import { generateApiKey, getApiKey } from '@/app/actions';
import { Header } from '@/components/header';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LineChart, History, Settings, Wifi, Loader2, Moon, Sun, KeyRound, Copy, Check, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { setTheme } = useTheme()
  const [deviceApiKey, setDeviceApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopiedDeviceKey, setHasCopiedDeviceKey] = useState(false);
  const [hasCopiedProjectKey, setHasCopiedProjectKey] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setIsLoading(true);
    getApiKey().then(result => {
      if(result.success) {
        setDeviceApiKey(result.data.apiKey);
      } else {
          toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch your Device API key.",
        });
      }
      setIsLoading(false);
    });
  }, [toast]);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    const result = await generateApiKey();
    if (result.success && result.data?.apiKey) {
      setDeviceApiKey(result.data.apiKey);
      toast({
        title: "Device API Key Generated",
        description: "Your new device API key is ready.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: result.error,
      });
    }
    setIsGenerating(false);
  };
  
  const copyToClipboard = (key: string, type: 'device' | 'project') => {
    navigator.clipboard.writeText(key);
    if (type === 'device') {
      setHasCopiedDeviceKey(true);
      setTimeout(() => setHasCopiedDeviceKey(false), 2000);
    } else {
      setHasCopiedProjectKey(true);
      setTimeout(() => setHasCopiedProjectKey(false), 2000);
    }
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/home">
                <LineChart />
                Prediction
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/history">
                <History />
                History
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive>
               <Link href="/settings">
                <Settings />
                Setting
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Switch between light and dark mode.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setTheme("light")}>
                  <Sun className="mr-2" /> Light
                </Button>
                 <Button variant="outline" onClick={() => setTheme("dark")}>
                  <Moon className="mr-2" /> Dark
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>ESP32 Integration</CardTitle>
              <CardDescription>
                API keys required for your ESP32 to connect to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="device-api-key" className="flex items-center gap-2">
                  <KeyRound /> Your Device API Key
                </Label>
                 {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : deviceApiKey ? (
                   <div className="flex items-center space-x-2">
                    <Input
                      id="device-api-key"
                      type="text"
                      value={deviceApiKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(deviceApiKey, 'device')}>
                      {hasCopiedDeviceKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground pt-2">
                    You don't have a Device API key yet. Generate one below.
                  </p>
                )}
                 <p className="text-sm text-muted-foreground">
                  Use this key in your ESP32 firmware to identify your device. It should be sent as the `Device-API-Key` header.
                </p>
              </div>

              <Button onClick={handleGenerateKey} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <KeyRound className="mr-2" />
                )}
                {isGenerating ? 'Generating...' : (deviceApiKey ? 'Generate New Device Key' : 'Generate Device API Key')}
              </Button>

              <div className="space-y-2 pt-4 border-t">
                 <Label htmlFor="project-api-key" className="flex items-center gap-2">
                  <Info /> Firebase Project API Key
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="project-api-key"
                    type="text"
                    value={firebaseConfig.apiKey}
                    readOnly
                    className="font-mono"
                  />
                   <Button variant="outline" size="icon" onClick={() => copyToClipboard(firebaseConfig.apiKey, 'project')}>
                      {hasCopiedProjectKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                 <p className="text-sm text-muted-foreground">
                  This public key identifies your Firebase project. It is required by your ESP32's firmware.
                </p>
              </div>

               <div className="flex items-center space-x-2 pt-4 border-t">
                <Wifi className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Your ESP32 should send POST requests to `/api/data` with the Device API key in the header.
                </p>
              </div>

            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}


'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Zap,
  Waves,
  Power as PowerIcon,
  Thermometer,
  Info,
  BatteryFull,
  Clock,
  Sun,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CommunityDistributionChart } from '@/components/dashboard/community-distribution-chart';
import { SolarGenerationChart } from '@/components/dashboard/solar-generation-chart';
import { BatteryStateChart } from '@/components/dashboard/battery-state-chart';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const isLoading = false;
  const voltage = 230.5;
  const current = 5.2;
  const power = voltage * current;
  const temperature = 25.3;
  const irradiance = 850;

  // Simulate the timestamp of the last received data
  // In a real app, this would come from Firestore.
  // This timestamp is recent, so the status will be "Online".
  const lastHeartbeat = new Date(); 

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const now = new Date();
    // Calculate the difference in minutes
    const diffInMinutes = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60);

    // If the last heartbeat was less than 5 minutes ago, consider it online.
    setIsConnected(diffInMinutes < 5);
  }, [lastHeartbeat]);


  const maintenanceAlerts = [
    { id: 1, title: 'Transient voltage spike', description: 'Edge node detected spike' },
    { id: 2, title: 'Transient voltage spike', description: 'Edge node detected spike' },
    { id: 3, title: 'Transient voltage spike', description: 'Edge node detected spike' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-6 bg-primary rounded-lg text-primary-foreground -mx-4 -mt-4 lg:-mx-6 lg:-mt-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Smart Solar Microgrid Management</h1>
            <p className="text-primary-foreground/80">Monitor your solar system in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10 border-2 border-primary-foreground/50">
            <AvatarImage src="https://picsum.photos/seed/user/40/40" alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback className="text-white">AMS</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-2xl font-bold">Loading...</div> : <div className="text-2xl font-bold">{voltage.toFixed(1)} V</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-2xl font-bold">Loading...</div> : <div className="text-2xl font-bold">{current.toFixed(2)} A</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <PowerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <div className="text-2xl font-bold">Loading...</div> : <div className="text-2xl font-bold">{power.toFixed(0)} W</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <div className="text-2xl font-bold">Loading...</div> : <div className="text-2xl font-bold">{temperature.toFixed(1)} °C</div>}
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Inverter Status</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (<div className="text-lg font-bold">Loading...</div>) : isConnected ? (
              <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-lg font-bold">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-lg font-bold">Offline</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Real-time state</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Battery Health</CardTitle>
            <BatteryFull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100.0 %</div>
            <p className="text-xs text-muted-foreground">Discharging</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Time to Full</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Not charging</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Solar Irradiance</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <div className="text-2xl font-bold">Loading...</div> : <div className="text-2xl font-bold">{irradiance.toFixed(0)} <span className="text-base font-normal">W/m²</span></div>}
            <p className="text-xs text-muted-foreground">Insolation level</p>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="col-span-1 lg:col-span-5">
          <CardContent className="h-[300px] p-2">
            <SolarGenerationChart />
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Community Distribution Today</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <CommunityDistributionChart />
          </CardContent>
        </Card>
        <Card>
           <CardHeader>
            <CardTitle>Battery State</CardTitle>
          </Header>
          <CardContent className="h-[200px] flex flex-col justify-center items-center">
            <BatteryStateChart />
             <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">Voltage: <span className="font-bold text-foreground">51.8V</span></p>
                <p className="text-xs text-muted-foreground">Charge Rate: <span className="font-bold text-foreground">0.4C</span></p>
                <p className="text-xs text-muted-foreground">Health Index: <span className="font-bold text-foreground">92%</span></p>
             </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-yellow-500" /> Predictive Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              {maintenanceAlerts.map((alert) => (
                <div key={alert.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <div>
                            <p className="font-semibold text-sm">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                    </div>
                    <Badge variant="destructive">warning</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

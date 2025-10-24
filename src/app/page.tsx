'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryCharging,
  Gauge,
  Info,
  Power,
  Sun,
  Thermometer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { SolarGenerationChart } from '@/components/dashboard/solar-generation-chart';
import { CommunityDistributionChart } from '@/components/dashboard/community-distribution-chart';
import { Badge } from '@/components/ui/badge';
import { BatteryStateChart } from '@/components/dashboard/battery-state-chart';
import { useUser } from '@/firebase/provider';

export default function Page() {
  const { user } = useUser();
  const maintenanceAlerts = [
    {
      id: 1,
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
    },
    {
      id: 2,
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
    },
    {
      id: 3,
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Smart Solar Microgrid Management</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Monitor your solar system in real-time
            </CardDescription>
          </div>
           <Avatar>
            <AvatarImage src={user?.photoURL || 'https://picsum.photos/seed/user/100/100'} data-ai-hint="profile avatar" alt="User Avatar" />
            <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </CardHeader>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">230.5 V</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.20 A</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1199 W</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25.3 °C</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inverter Status</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-lg font-semibold">Online</span>
            </div>
            <p className="text-xs text-muted-foreground">Real-time state</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Battery Health</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100.0 %</div>
            <p className="text-xs text-muted-foreground">Discharging</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Time to Full</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Not charging</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solar Irradiance</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">850 <span className='text-lg'>W/m²</span></div>
            <p className="text-xs text-muted-foreground">Insolation level</p>
          </CardContent>
        </Card>
      </div>

      {/* Solar Generation Chart */}
      <Card>
        <CardContent className="h-[300px] p-0 pt-6">
          <SolarGenerationChart />
        </CardContent>
      </Card>

      {/* Community Distribution & Battery State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Community Distribution Today</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <CommunityDistributionChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Battery State</CardTitle>
          </CardHeader>
          <CardContent>
            <BatteryStateChart />
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Predictive Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {maintenanceAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive/80" />
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

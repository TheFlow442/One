
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  BatteryCharging,
  BatteryWarning,
  Power,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { SolarGenerationChart } from '@/components/dashboard/solar-generation-chart';
import { BatteryStateChart } from '@/components/dashboard/battery-state-chart';
import { CommunityDistributionChart } from '@/components/dashboard/community-distribution-chart';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Generation
            </CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.4 kW</div>
            <p className="text-xs text-muted-foreground">
              Live from PV array
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Load</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.1 kW</div>
            <p className="text-xs text-muted-foreground">
              Total consumption
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Battery
            </CardTitle>
            <BatteryCharging className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground">
              State of Charge
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Grid Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Stable</div>
            <p className="text-xs text-muted-foreground">
              Nominal voltage and frequency
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Solar Generation</CardTitle>
              <CardDescription>
                Live power output from the solar array.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <SolarGenerationChart />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Battery Health</CardTitle>
              <CardDescription>
                State of Health (SOH)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatteryStateChart />
            </CardContent>
          </Card>
        </div>
      </div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Community Distribution</CardTitle>
            <CardDescription>Load per microgrid community.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <CommunityDistributionChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> Community Overview</CardTitle>
                <CardDescription>Summary of all connected communities.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <h4 className="text-2xl font-bold">3</h4>
                    <p className="text-sm text-muted-foreground">Communities</p>
                </div>
                 <div>
                    <h4 className="text-2xl font-bold">15</h4>
                    <p className="text-sm text-muted-foreground">Total Nodes</p>
                </div>
                 <div>
                    <h4 className="text-2xl font-bold">12</h4>
                    <p className="text-sm text-muted-foreground">Online Nodes</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

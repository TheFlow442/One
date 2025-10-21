'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  LineChart,
  ArrowRight,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CommunityDistributionChart } from '@/components/dashboard/community-distribution-chart';
import { SolarGenerationChart } from '@/components/dashboard/solar-generation-chart';
import { BatteryStateChart } from '@/components/dashboard/battery-state-chart';

export default function DashboardPage() {
  const [voltage, setVoltage] = useState(0);
  const [current, setCurrent] = useState(0);
  const [temperature, setTemperature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVoltage(230 + Math.random() * 5);
      setCurrent(4 + Math.random() * 1.5);
      setTemperature(35 + Math.random() * 10);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const power = voltage * current;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Solar Microgrid Management</h1>
          <p className="text-muted-foreground">Monitor your solar system in real-time</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Image
              src="https://picsum.photos/seed/user/40/40"
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
              data-ai-hint="user avatar"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{voltage.toFixed(1)} V</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{current.toFixed(2)} A</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <PowerIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{power.toFixed(0)} W</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{temperature.toFixed(1)} °C</div>
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
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xl font-bold">Online</span>
            </div>
            <p className="text-xs text-muted-foreground">ESP32 Connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Battery Health</CardTitle>
            <BatteryFull className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">100.0 %</div>
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
             <div className="text-2xl font-bold">0 <span className="text-base font-normal">W/m²</span></div>
            <p className="text-xs text-muted-foreground">Insolation level</p>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="col-span-1 lg:col-span-5">
           <CardHeader>
              <CardTitle>Solar Generation</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pr-0">
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
          </CardHeader>
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
              <div className="flex justify-between items-center">
                  <div>
                      <p className="font-bold">Transient voltage spike</p>
                      <p className="text-xs text-muted-foreground">Edge node detected spike</p>
                  </div>
                  <Badge variant="warning">warning</Badge>
              </div>
              <div className="flex justify-between items-center">
                  <div>
                      <p className="font-bold">Transient voltage spike</p>
                      <p className="text-xs text-muted-foreground">Edge node detected spike</p>
                  </div>
                   <Badge variant="warning">warning</Badge>
              </div>
               <div className="flex justify-between items-center">
                  <div>
                      <p className="font-bold">Transient voltage spike</p>
                      <p className="text-xs text-muted-foreground">Edge node detected spike</p>
                  </div>
                   <Badge variant="warning">warning</Badge>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

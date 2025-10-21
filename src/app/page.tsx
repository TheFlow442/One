'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart,
  Book,
  FileText,
  LineChart,
  Users,
  Percent,
} from 'lucide-react';
import { CommunityEnergyTrendChart } from '@/components/dashboard/community-energy-trend-chart';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [voltage, setVoltage] = useState(230.5);
  const [current, setCurrent] = useState(4.2);
  const [temperature, setTemperature] = useState(38);

  useEffect(() => {
    const interval = setInterval(() => {
      setVoltage(230 + Math.random() * 5); // Fluctuate voltage around 230-235V
      setCurrent(4 + Math.random() * 1.5); // Fluctuate current around 4-5.5A
      setTemperature(35 + Math.random() * 10); // Fluctuate temperature between 35-45°C
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const power = voltage * current;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voltage.toFixed(1)} V</div>
            <p className="text-xs text-muted-foreground">Simulated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{current.toFixed(2)} A</div>
            <p className="text-xs text-muted-foreground">Simulated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{power.toFixed(2)} W</div>
            <p className="text-xs text-muted-foreground">Calculated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{temperature.toFixed(1)} °C</div>
            <p className="text-xs text-muted-foreground">Simulated</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6">
        <Card>
           <CardHeader>
              <CardTitle>Community A - Energy Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pr-0">
            <CommunityEnergyTrendChart />
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live Metrics</CardTitle>
            <LineChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Live metrics will be displayed here.</p>
             <Button variant="outline" size="sm" className="mt-4">View Details <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No new alerts.</p>
             <Button variant="outline" size="sm" className="mt-4">View All <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

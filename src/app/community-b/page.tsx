'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CommunityEnergyTrendChart } from '@/components/dashboard/community-energy-trend-chart';
import { Users } from 'lucide-react';

export default function CommunityBPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Users className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Community B</h1>
          <p className="text-muted-foreground">
            Monitoring average load usage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Energy Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <CommunityEnergyTrendChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

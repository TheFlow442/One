import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UsageChart } from './usage-chart';
import { HISTORICAL_DATA } from '@/lib/data';
import { Activity } from 'lucide-react';

export function UsageHistory() {
  return (
    <Card className="shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity className="text-primary w-6 h-6" />
          <CardTitle className="font-headline text-xl">Energy Usage History</CardTitle>
        </div>
        <CardDescription>Monthly energy consumption over the last year.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsageChart data={HISTORICAL_DATA} />
      </CardContent>
    </Card>
  );
}

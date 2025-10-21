import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyEnergyUsageChart } from '@/components/dashboard/weekly-energy-usage-chart';

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Energy Usage</CardTitle>
          <CardDescription>Your weekly energy consumption</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <WeeklyEnergyUsageChart />
        </CardContent>
      </Card>
    </div>
  );
}

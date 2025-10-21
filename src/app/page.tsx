import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg Load (24h)</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.82 kW</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Energy Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 kWh</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Allocation</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">41%</div>
            <p className="text-xs text-muted-foreground">Policy in Settings</p>
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

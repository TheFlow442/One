import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Zap,
  Waves,
  Flame,
  Thermometer,
  Server,
  Battery,
  Hourglass,
  Sun,
  Users,
  TestTube,
} from 'lucide-react';
import { SolarGenerationChart } from '@/components/dashboard/solar-generation-chart';
import { CommunityDistributionChart } from '@/components/dashboard/community-distribution-chart';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="bg-primary text-primary-foreground p-6 rounded-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Smart Solar Microgrid Management</h1>
          <p className="text-sm">Monitor your solar system in real-time</p>
        </div>
        <Avatar>
          <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0.0 V</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0.00 A</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0 W</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">0.0 °C</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Inverter Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-gray-500"></span>
              Offline
            </div>
            <p className="text-xs text-muted-foreground">Real-time state</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Battery Health</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">100.0 %</div>
            <p className="text-xs text-muted-foreground">Discharging</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Time to Full</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
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
            <div className="text-2xl font-bold text-yellow-400">0 W/m²</div>
            <p className="text-xs text-muted-foreground">Insolation level</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
           <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Solar Generation</CardTitle>
              <CardDescription>
                A chart showing solar power generation over time.
              </CardDescription>
            </div>
             <Badge variant="outline" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              Simulated Data
            </Badge>
          </CardHeader>
          <CardContent className="h-[250px] pr-0">
            <SolarGenerationChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                <CardTitle>Community Distribution Today</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <TestTube className="h-3 w-3" />
              Simulated Data
            </Badge>
          </CardHeader>
          <CardContent className="h-[250px] pr-0">
            <CommunityDistributionChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

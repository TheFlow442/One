
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommunityConsumptionGenerationChart } from '@/components/dashboard/community-consumption-generation-chart';
import { Users, Zap, User, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const communityNodes = [
  { id: 'NODE-B01', status: 'online', load: 1.1, household: 'Davis' },
  { id: 'NODE-B02', status: 'offline', load: 0.0, household: 'Miller' },
  { id: 'NODE-B03', status: 'online', load: 1.3, household: 'Wilson' },
  { id: 'NODE-B04', status: 'online', load: 0.7, household: 'Moore' },
  { id: 'NODE-B05', status: 'online', load: 1.0, household: 'Taylor' },
];

const communityAlerts = [
    { id: 'alert-c3', title: 'Voltage Dip on NODE-B01', timestamp: '3:45 PM', level: 'warning' },
    { id: 'alert-c4', title: 'NODE-B02 Offline', timestamp: '3:00 PM', level: 'destructive' },
];

const chartData = [
    { day: '1', consumption: 22, generation: 28 },
    { day: '2', consumption: 26, generation: 25 },
    { day: '3', consumption: 28, generation: 32 },
    { day: '4', consumption: 24, generation: 30 },
    { day: '5', consumption: 30, generation: 35 },
    { day: '6', consumption: 32, generation: 31 },
    { day: '7', consumption: 27, generation: 34 },
];


export default function CommunityBPage() {
  const totalConsumption = communityNodes.reduce((acc, node) => acc + node.load, 0);
  const onlineNodes = communityNodes.filter(node => node.status === 'online').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Users className="h-8 w-8" />
            <div>
            <h1 className="text-3xl font-bold">Community B</h1>
            <p className="text-muted-foreground">
                Detailed monitoring and management for Community B.
            </p>
            </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalConsumption.toFixed(2)} kW</div>
                <p className="text-xs text-muted-foreground">Live from all online nodes</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Connected Nodes</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{onlineNodes} / {communityNodes.length}</div>
                <p className="text-xs text-muted-foreground">Online right now</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Peak Load (Today)</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">4.2 kW</div>
                 <p className="text-xs text-muted-foreground">at 1:15 PM</p>
            </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Nodes in Community B</CardTitle>
                <CardDescription>
                    List of all connected households and their current status.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Node ID</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Current Load</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {communityNodes.map((node) => (
                    <TableRow key={node.id}>
                        <TableCell className="font-medium">{node.id}</TableCell>
                        <TableCell>{node.household}</TableCell>
                        <TableCell>
                        <Badge
                            className={cn({
                            'bg-green-500/20 text-green-400 border-transparent': node.status === 'online',
                            'bg-red-500/20 text-red-400 border-transparent': node.status === 'offline',
                            })}
                        >
                            {node.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">{node.load.toFixed(2)} kW</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle /> Community Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                     {communityAlerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{alert.title}</p>
                                <p className="text-sm text-muted-foreground">{alert.timestamp}</p>
                            </div>
                            <Badge variant={alert.level as "default" | "destructive" | "secondary" | "outline" | null | undefined}>{alert.level}</Badge>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full">
                        View All Alerts <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Consumption vs. Generation (Last 7 Days)</CardTitle>
            <CardDescription>
                Daily comparison of energy consumed by the community versus solar energy generated.
            </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
            <CommunityConsumptionGenerationChart data={chartData} />
        </CardContent>
    </Card>
    </div>
  );
}

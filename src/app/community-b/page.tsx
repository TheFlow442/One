
'use client';

import { useState, useEffect } from 'react';
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
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const COMMUNITY_B_USER_ID = 'F0jfqt20cPXSqJ2nsJeZtseO1qn2';
const DATA_LIMIT = 20;

export default function CommunityBPage() {
  const firestore = useFirestore();
  const [latestData, setLatestData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const espDataQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users', COMMUNITY_B_USER_ID, 'esp32_data'),
      orderBy('timestamp', 'desc'),
      limit(DATA_LIMIT)
    );
  }, [firestore]);

  const { data: espData, isLoading: isEspDataLoading } = useCollection<any>(espDataQuery);

  useEffect(() => {
    if (espData && espData.length > 0) {
      setLatestData(espData[0]); // The first item is the latest
      setHistoricalData(espData); // The whole array for the chart
    } else {
      setLatestData(null);
      setHistoricalData([]);
    }
  }, [espData]);
  
  const communityNode = latestData ? {
      id: 'NODE-B01',
      status: 'online',
      voltage: latestData.comB_V,
      current: latestData.comB_I,
      power: latestData.comB_V * latestData.comB_I
  } : null;

  const totalConsumption = communityNode ? communityNode.power / 1000 : 0;
  const onlineNodes = communityNode ? 1 : 0;
  
  const chartData = historicalData
    .map(d => ({
        // Format timestamp to a readable time string
        day: d.timestamp ? new Date(d.timestamp.toDate()).toLocaleTimeString() : 'N/A',
        consumption: (d.comB_V * d.comB_I) / 1000, // in kW
        generation: (d.irradiance / 1000) * 1.5, // Estimated generation in kW
    }))
    .reverse(); // Reverse to show chronological order

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
            {isEspDataLoading && !latestData ? <Skeleton className="h-8 w-24"/> : 
                <>
                    <div className="text-2xl font-bold">{totalConsumption.toFixed(2)} kW</div>
                    <p className="text-xs text-muted-foreground">Live from all online nodes</p>
                </>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connected Nodes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isEspDataLoading && !latestData ? <Skeleton className="h-8 w-24"/> : 
                <>
                    <div className="text-2xl font-bold">{onlineNodes} / 1</div>
                    <p className="text-xs text-muted-foreground">Online right now</p>
                </>
            }
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Peak Load (Today)</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {isEspDataLoading && !latestData ? <Skeleton className="h-8 w-24"/> :
                    <>
                        <div className="text-2xl font-bold">{totalConsumption.toFixed(2)} kW</div>
                        <p className="text-xs text-muted-foreground">Current load</p>
                    </>
                }
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nodes in Community B</CardTitle>
              <CardDescription>
                Live status of the community's edge node.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEspDataLoading && !latestData ? <Skeleton className="h-40 w-full"/> : communityNode ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Node ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Voltage</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Power</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow key={communityNode.id}>
                      <TableCell className="font-medium">{communityNode.id}</TableCell>
                      <TableCell>
                        <Badge className={cn({
                          'bg-green-500/20 text-green-400 border-transparent': communityNode.status === 'online',
                          'bg-red-500/20 text-red-400 border-transparent': communityNode.status === 'offline',
                        })}>
                          {communityNode.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{communityNode.voltage.toFixed(2)} V</TableCell>
                      <TableCell className="text-right">{communityNode.current.toFixed(2)} A</TableCell>
                      <TableCell className="text-right">{communityNode.power.toFixed(2)} W</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Waiting for data from the edge node...</p>
              )}
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
              <p className="text-sm text-muted-foreground">No active alerts for this community.</p>
              <Button variant="outline" asChild>
                <Link href="/alerts">
                  View All System Alerts <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consumption vs. Generation (Live)</CardTitle>
          <CardDescription>
            Live comparison of energy consumed by the community versus estimated solar energy generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {isEspDataLoading && historicalData.length === 0 ? <Skeleton className="h-full w-full"/> : 
            <CommunityConsumptionGenerationChart data={chartData} />
          }
        </CardContent>
      </Card>
    </div>
  );
}

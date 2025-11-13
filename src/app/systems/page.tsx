
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, BatteryCharging, Gauge, Activity, TowerControl, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

// We'll use Community A's data as representative of the whole system status
const SYSTEM_DATA_USER_ID = '0nkCeSiTQbcTEhEMcUhQwYT39U72';

export default function SystemsPage() {
  const firestore = useFirestore();
  const [latestData, setLatestData] = useState<any>(null);

  const latestDataQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `users/${SYSTEM_DATA_USER_ID}/esp32_data`),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore]);

  const { data: firestoreData, isLoading: isFirestoreDataLoading } = useCollection<any>(latestDataQuery);

  useEffect(() => {
    if (firestoreData && firestoreData.length > 0) {
      setLatestData(firestoreData[0]);
    } else {
      setLatestData(null);
    }
  }, [firestoreData]);


  const getBatteryStatus = () => {
    if (!latestData || latestData.batteryI === undefined) return 'unknown';
    if (latestData.batteryI > 0.1) return 'charging';
    if (latestData.batteryI < -0.1) return 'discharging';
    return 'idle';
  };

  const systems = latestData ? [
    {
      name: 'PV Array',
      icon: <Sun className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: `${((latestData.panelV || 0) * (latestData.panelI || 0)).toFixed(1)} W`,
      lastUpdate: latestData.timestamp ? formatDistanceToNow(latestData.timestamp.toDate(), { addSuffix: true }) : 'N/A',
    },
    {
      name: 'Battery Bank',
      icon: <BatteryCharging className="h-6 w-6 text-muted-foreground" />,
      status: getBatteryStatus(),
      kpi: `SOC ${(latestData.batteryPercent || 0).toFixed(0)}%`,
      lastUpdate: latestData.timestamp ? formatDistanceToNow(latestData.timestamp.toDate(), { addSuffix: true }) : 'N/A',
    },
    {
      name: 'Inverter',
      icon: <Gauge className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: `AC ${(latestData.inverterV || 0).toFixed(1)}V`,
      lastUpdate: latestData.timestamp ? formatDistanceToNow(latestData.timestamp.toDate(), { addSuffix: true }) : 'N/A',
    },
    {
      name: 'Controller',
      icon: <Activity className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: `MPPT ok`,
      lastUpdate: latestData.timestamp ? formatDistanceToNow(latestData.timestamp.toDate(), { addSuffix: true }) : 'N/A',
    },
    {
      name: 'Comms',
      icon: <Layers className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: 'Firestore',
      lastUpdate: latestData.timestamp ? formatDistanceToNow(latestData.timestamp.toDate(), { addSuffix: true }) : 'N/A',
    },
     {
      name: 'ESP32 Device',
      icon: <TowerControl className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: `Vin ${(latestData.supplyVoltage || 0).toFixed(2)}V`,
      lastUpdate: latestData.timestamp ? formatDistanceToNow(latestData.timestamp.toDate(), { addSuffix: true }) : 'N/A',
    },
  ] : null;

  const statusColors: { [key: string]: string } = {
    online: 'bg-green-500/20 text-green-400 border-transparent',
    charging: 'bg-yellow-500/20 text-yellow-400 border-transparent',
    discharging: 'bg-blue-500/20 text-blue-400 border-transparent',
    idle: 'bg-gray-500/20 text-gray-400 border-transparent',
    unknown: 'bg-red-500/20 text-red-400 border-transparent',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isFirestoreDataLoading && !systems ? (
            Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-6 w-6 rounded-full" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <Skeleton className="h-5 w-16" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-20" />
                    </CardContent>
                </Card>
            ))
        ) : systems ? (
            systems.map((system) => (
                <Card key={system.name}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {system.icon}
                        <CardTitle className="text-lg font-medium">{system.name}</CardTitle>
                    </div>
                    <Badge className={cn(statusColors[system.status] || 'bg-gray-500/20 text-gray-400 border-transparent')}>
                        {system.status}
                    </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium text-muted-foreground">KPI: {system.kpi}</p>
                    <p className="text-xs text-muted-foreground mt-1">Last update: {system.lastUpdate}</p>
                </CardContent>
                </Card>
            ))
        ) : (
             <div className="col-span-full text-center p-8 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">Waiting for live data from the ESP32...</p>
            </div>
        )}
    </div>
  );
}

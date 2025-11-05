
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertTriangle,
  Battery,
  Info,
  Power,
  Sun,
  Thermometer,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { SolarGenerationChart } from '@/components/dashboard/solar-generation-chart';
import { CommunityDistributionChart } from '@/components/dashboard/community-distribution-chart';
import { Badge } from '@/components/ui/badge';
import { BatteryStateChart } from '@/components/dashboard/battery-state-chart';
import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { deriveMetrics, DeriveMetricsInput, DeriveMetricsOutput } from '@/ai/flows/derive-metrics-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const communityUsers = {
    'Community A': '0nkCeSiTQbcTEhEMcUhQwYT39U72',
    'Community B': 'F0jfqt20cPXSqJ2nsJeZtseO1qn2',
    'Community C': '7yV6eXu6A1ReAXdtqOVMWszmiOD2',
};
type Community = keyof typeof communityUsers;

const initialMetrics: Omit<DeriveMetricsOutput, 'power'> = {
  batteryHealth: 0,
  batteryState: 'Idle',
  timeToFull: '--',
  maintenanceAlerts: [],
};

// This is a server-side check that gets passed to the client
const isApiKeySet = process.env.NEXT_PUBLIC_IS_GEMINI_API_KEY_SET === 'true';
const LIVE_THRESHOLD_SECONDS = 15; // Consider offline if no data for 15s

export default function Page() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [metrics, setMetrics] = useState<Omit<DeriveMetricsOutput, 'power'>>(initialMetrics);
  const [currentSensorData, setCurrentSensorData] = useState<any>(null); // Using 'any' to accommodate new fields
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community>('Community A');

  const selectedUserId = communityUsers[selectedCommunity];

  const espDataQuery = useMemoFirebase(() => {
    if (!selectedUserId || !firestore) return null;
    return query(
      collection(firestore, 'users', selectedUserId, 'esp32_data'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [selectedUserId, firestore]);

  const { data: espData, isLoading: isEspDataLoading } = useCollection<any>(espDataQuery);

  useEffect(() => {
    const getMetrics = async (sensorData: any) => {
      setLoading(true);

      if (!isApiKeySet) {
        setMetrics(initialMetrics);
        setLoading(false);
        return;
      }
      
      try {
        const input: DeriveMetricsInput = {
          communityId: selectedCommunity,
          inverterV: sensorData.inverterV || 0,
          inverterI: sensorData.inverterI || 0,
          batteryV: sensorData.batteryV || 0,
          batteryI: sensorData.batteryI || 0,
          batteryTemp: sensorData.batteryTemp || 0,
          irradiance: sensorData.irradiance || 0,
        };
        const result = await deriveMetrics(input);
        const { power, ...restOfMetrics } = result;
        setMetrics(restOfMetrics);
      } catch (e: any) {
        console.error("Error deriving metrics:", e);
        setMetrics(initialMetrics);
      } finally {
        setLoading(false);
      }
    };
    
    if (espData && espData.length > 0) {
      const latestData = espData[0];
      const now = new Date();
      const dataTimestamp = latestData.timestamp?.toDate();
      const isDataFresh = dataTimestamp && (now.getTime() - dataTimestamp.getTime()) / 1000 < LIVE_THRESHOLD_SECONDS;

      if (isDataFresh) {
        setIsLive(true);
        setCurrentSensorData(latestData);
        getMetrics(latestData);
      } else {
         setIsLive(false);
         setCurrentSensorData(null);
         setMetrics(initialMetrics);
         setLoading(false);
      }
    } else if (!isEspDataLoading) {
      setIsLive(false);
      setCurrentSensorData(null);
      setMetrics(initialMetrics);
      setLoading(false);
    }
    
    const intervalId = setInterval(() => {
        if (espData && espData.length > 0) {
            const latestData = espData[0];
            const now = new Date();
            const dataTimestamp = latestData.timestamp?.toDate();
            if (!dataTimestamp || (now.getTime() - dataTimestamp.getTime()) / 1000 > LIVE_THRESHOLD_SECONDS) {
                if (isLive) {
                    setIsLive(false);
                    setCurrentSensorData(null);
                    setMetrics(initialMetrics);
                }
            }
        } else if (isLive) {
            setIsLive(false);
            setCurrentSensorData(null);
            setMetrics(initialMetrics);
        }
    }, LIVE_THRESHOLD_SECONDS * 500);

    return () => clearInterval(intervalId);

  }, [espData, isEspDataLoading, selectedCommunity, isLive]);

  const power = currentSensorData ? currentSensorData.totalPower : 0;
  const solarIrradiance = currentSensorData ? currentSensorData.irradiance : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl">Smart Solar Microgrid Management</CardTitle>
              {isLive && (
                <Badge variant="outline" className="border-green-400 bg-green-400/10 text-green-300">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live
                </Badge>
              )}
            </div>
            <CardDescription className="text-primary-foreground/80">
              Monitor your solar system in real-time
            </CardDescription>
          </div>
           <Avatar>
            <AvatarImage src={user?.photoURL || 'https://picsum.photos/seed/user/100/100'} data-ai-hint="profile avatar" alt="User Avatar" />
            <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className='flex-row items-center justify-between'>
            <div className="flex items-center gap-2">
                <Users />
                <CardTitle>Community Dashboard</CardTitle>
            </div>
            <Select onValueChange={(value: Community) => setSelectedCommunity(value)} defaultValue={selectedCommunity}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(communityUsers).map(communityName => (
                        <SelectItem key={communityName} value={communityName}>{communityName}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </CardHeader>
      </Card>
      
       {isEspDataLoading && !currentSensorData && (
          <Card>
             <CardContent className="pt-6">
              <p className="text-muted-foreground">Connecting to your ESP32 device...</p>
            </CardContent>
          </Card>
        )}

       {!isEspDataLoading && !currentSensorData && !isLive && (
          <Card>
            <CardHeader>
              <CardTitle>Waiting for Data for {selectedCommunity}</CardTitle>
              <CardDescription>
                No data has been received for this community yet, or the device is offline. Please ensure your ESP32 device is on, connected, and sending data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Follow the <a href="/esp32" className="underline text-primary">ESP32 Connection Guide</a> to get started.</p>
            </CardContent>
          </Card>
        )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inverter Voltage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isEspDataLoading || !currentSensorData ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{(currentSensorData.inverterV || 0).toFixed(1)} V</div>}
            <p className="text-xs text-muted-foreground">
              {isEspDataLoading && !currentSensorData ? 'Waiting for data...' : isLive ? 'Live Reading' : 'Offline'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inverter Current</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isEspDataLoading || !currentSensorData ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{(currentSensorData.inverterI || 0).toFixed(2)} A</div>}
             <p className="text-xs text-muted-foreground">
              {isEspDataLoading && !currentSensorData ? 'Waiting for data...' : isLive ? 'Live Reading' : 'Offline'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Power</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isEspDataLoading || !currentSensorData ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{power.toFixed(0)} W</div>}
             <p className="text-xs text-muted-foreground">
              {isEspDataLoading && !currentSensorData ? 'Waiting for data...' : isLive ? 'Live Calculation' : 'Offline'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Battery Temp</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isEspDataLoading || !currentSensorData ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{(currentSensorData.batteryTemp || 0).toFixed(1)} °C</div>}
             <p className="text-xs text-muted-foreground">
              {isEspDataLoading && !currentSensorData ? 'Waiting for data...' : isLive ? 'Live Reading' : 'Offline'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Battery Health</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !isLive ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{metrics.batteryHealth.toFixed(1)} %</div>}
            <p className="text-xs text-muted-foreground">{loading || !isLive ? 'Analyzing...' : metrics.batteryState}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Time to Full</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || !isLive ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{metrics.timeToFull}</div>}
            <p className="text-xs text-muted-foreground">{loading || !isLive ? 'Analyzing...' : (metrics.batteryState === 'Charging' ? 'Charging' : 'Not charging')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solar Irradiance</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isEspDataLoading || !currentSensorData ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{solarIrradiance.toFixed(0)} <span className='text-lg'>W/m²</span></div>}
            <p className="text-xs text-muted-foreground">
              {isEspDataLoading && !currentSensorData ? 'Waiting for data...' : isLive ? 'Live Calculation' : 'Offline'}
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Predictive Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {loading || !isLive ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <div className='space-y-2'>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))
            ) : metrics.maintenanceAlerts.length > 0 ? (
              metrics.maintenanceAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive/80" />
                    <div>
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                  <Badge variant="destructive">warning</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No maintenance alerts at this time.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Solar Generation Chart */}
      <Card>
        <CardContent className="h-[300px] p-0 pt-6">
          <SolarGenerationChart />
        </CardContent>
      </Card>

      {/* Community Distribution & Battery State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Community Distribution Today</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <CommunityDistributionChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Battery State</CardTitle>
          </CardHeader>
          <CardContent>
            <BatteryStateChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );

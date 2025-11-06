
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  Battery,
  HardDrive,
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
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRtdbValue } from '@/firebase/realtimedb/use-rtdb-value';
import { CodeBlock } from '@/components/code-block';
import { deriveMetrics, DeriveMetricsInput, DeriveMetricsOutput } from '@/ai/flows/derive-metrics-flow';


const communityUsers = {
  'Community A': '0nkCeSiTQbcTEhEMcUhQwYT39U72',
  'Community B': 'F0jfqt20cPXSqJ2nsJeZtseO1qn2',
  'Community C': '7yV6eXu6A1ReAXdtqOVMWszmiOD2',
};
type Community = keyof typeof communityUsers;

const initialMetrics: Partial<DeriveMetricsOutput> = {
  maintenanceAlerts: [],
};

const isApiKeySet = process.env.NEXT_PUBLIC_IS_GEMINI_API_KEY_SET === 'true';
const LIVE_THRESHOLD_SECONDS = 10; // Data is stale if older than 10 seconds

export default function Page() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState<Partial<DeriveMetricsOutput>>(initialMetrics);
  const [currentSensorData, setCurrentSensorData] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [isDerivingMetrics, setIsDerivingMetrics] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community>('Community A');

  const selectedUserId = communityUsers[selectedCommunity];
  const { data: rtdbData, isLoading: isRtdbLoading } = useRtdbValue<any>(`esp32_live/${selectedUserId}`);

  useEffect(() => {
    const processData = async () => {
      if (!rtdbData) {
        setIsLive(false);
        setCurrentSensorData(null);
        setMetrics(initialMetrics);
        return;
      }
      
      const latestData = rtdbData;
      const serverTimestamp = latestData.serverTimestamp ? new Date(latestData.serverTimestamp) : new Date(0);
      const isDataFresh = (Date.now() - serverTimestamp.getTime()) / 1000 < LIVE_THRESHOLD_SECONDS;
      
      console.log(`[${selectedCommunity}] New RTDB data received. Timestamp: ${serverTimestamp.toISOString()}, Fresh: ${isDataFresh}`);

      setIsLive(isDataFresh);
      setCurrentSensorData(latestData);
      
      if (isDataFresh && isApiKeySet) {
        setIsDerivingMetrics(true);
        try {
          const input: DeriveMetricsInput = {
            communityId: selectedCommunity,
            inverterV: latestData.inverterV || 0,
            inverterI: latestData.inverterI || 0,
            batteryV: latestData.batteryV || 0,
            batteryI: latestData.batteryI || 0,
            batteryTemp: latestData.batteryTemp || 0,
            irradiance: latestData.irradiance || 0,
          };
          const result = await deriveMetrics(input);
          setMetrics(result);
        } catch (e: any) {
          console.error("Error deriving metrics:", e);
          setMetrics(initialMetrics);
        } finally {
          setIsDerivingMetrics(false);
        }
      } else if (!isDataFresh) {
        setMetrics(initialMetrics);
      }
    };
    
    processData();

  }, [rtdbData, selectedCommunity]);

  const isLoading = isRtdbLoading || (isLive && isDerivingMetrics);
  
  // Safely access all data with fallbacks to 0 to prevent crashes from corrupt/partial data
  const power = currentSensorData?.totalPower ?? 0;
  const solarIrradiance = currentSensorData?.irradiance ?? 0;
  const batterySoc = currentSensorData?.batteryPercent ?? 0;
  const voltage = currentSensorData?.inverterV ?? 0;
  const current = currentSensorData?.inverterI ?? 0;
  const temperature = currentSensorData?.batteryTemp ?? 0;


  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl">Smart Solar Microgrid Management</CardTitle>
              {isLive && !isRtdbLoading && (
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
      
      {isRtdbLoading && !currentSensorData && (
         <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HardDrive />Connecting...</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Attempting to connect to your ESP32 device via the Realtime Database for {selectedCommunity}...</p>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
       <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isLive ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{(power || 0).toFixed(2)} W</div>
                <p className="text-xs text-muted-foreground">Total system output</p>
              </>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solar Irradiance</CardTitle>
            <Sun className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isLive ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{(solarIrradiance || 0).toFixed(0)} W/m²</div>
                <p className="text-xs text-muted-foreground">Current solar intensity</p>
              </>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Battery SOC</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isLive ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{(batterySoc || 0).toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">State of Charge</p>
              </>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voltage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isLive ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{(voltage || 0).toFixed(2)} V</div>
                <p className="text-xs text-muted-foreground">Live AC output</p>
              </>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isLive ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{(current || 0).toFixed(2)} A</div>
                <p className="text-xs text-muted-foreground">Live AC current draw</p>
              </>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isLive ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{(temperature || 0).toFixed(1)} °C</div>
                <p className="text-xs text-muted-foreground">Live battery temperature</p>
              </>
            }
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Maintenance Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
             {isLoading && !isLive ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{metrics.maintenanceAlerts?.length || 0}</div>
                <p className="text-xs text-destructive/80">Active AI-detected alerts</p>
              </>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="h-[300px] p-0 pt-6">
          <SolarGenerationChart />
        </CardContent>
      </Card>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className='flex items-center gap-2'>
              <HardDrive /> Live Data Inspector
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle>Raw Realtime Database JSON</CardTitle>
                <CardDescription>
                  This is the raw, unfiltered JSON data being received from the path <strong>/esp32_live/{selectedUserId}</strong>. It updates in real-time. Use this to debug the data your ESP32 is sending.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isRtdbLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : rtdbData ? (
                  <CodeBlock
                    code={JSON.stringify(rtdbData, null, 2)}
                    language="json"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No data available at this path.</p>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Community Distribution Today</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-0">
            <CommunityDistributionChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Battery State</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BatteryStateChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
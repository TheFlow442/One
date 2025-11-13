
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CodeBlock } from '@/components/code-block';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { AiAlertEngine } from '@/components/dashboard/ai-alert-engine';
import { BatteryStateChart } from '@/components/dashboard/battery-state-chart';


const communityUsers = {
  'Community A': '0nkCeSiTQbcTEhEMcUhQwYT39U72',
  'Community B': 'F0jfqt20cPXSqJ2nsJeZtseO1qn2',
  'Community C': '7yV6eXu6A1ReAXdtqOVMWszmiOD2',
};
type Community = keyof typeof communityUsers;

const LIVE_THRESHOLD_SECONDS = 15; // Data is stale if older than 15 seconds

export default function Page() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [currentSensorData, setCurrentSensorData] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community>('Community A');

  const selectedUserId = communityUsers[selectedCommunity];

  // Query for the latest document in the esp32_data subcollection
  const latestDataQuery = useMemoFirebase(() => {
    if (!firestore || !selectedUserId) return null;
    return query(
      collection(firestore, `users/${selectedUserId}/esp32_data`),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore, selectedUserId]);

  const { data: firestoreData, isLoading: isFirestoreLoading } = useCollection<any>(latestDataQuery);

  useEffect(() => {
    if (firestoreData && firestoreData.length > 0) {
      const latestData = firestoreData[0];
      setCurrentSensorData(latestData);

      // Check if data is live
      const dataTimestamp = latestData.timestamp?.toDate();
      if (dataTimestamp) {
        const isDataFresh = (Date.now() - dataTimestamp.getTime()) / 1000 < LIVE_THRESHOLD_SECONDS;
        setIsLive(isDataFresh);
      } else {
        setIsLive(false);
      }
    } else {
      setCurrentSensorData(null);
      setIsLive(false);
    }
  }, [firestoreData]);

  const isLoading = isFirestoreLoading && !currentSensorData;
  
  // Safely access all data with fallbacks to 0 to prevent crashes from corrupt/partial data
  const power = currentSensorData?.totalPower ?? 0;
  const solarIrradiance = currentSensorData?.irradiance ?? 0;
  const batterySoc = currentSensorData?.batteryPercent ?? 0;
  const voltage = currentSensorData?.inverterV ?? 0;
  const current = currentSensorData?.inverterI ?? 0;
  const temperature = currentSensorData?.batteryTemp ?? 0;
  const supplyVoltage = currentSensorData?.supplyVoltage ?? 0;

  const solarGenerationValue = (currentSensorData?.panelV ?? 0) * (currentSensorData?.panelI ?? 0);
  const communityDistributionData = [
    { name: "A", value: (currentSensorData?.comA_V ?? 0) * (currentSensorData?.comA_I ?? 0) },
    { name: "B", value: (currentSensorData?.comB_V ?? 0) * (currentSensorData?.comB_I ?? 0) },
    { name: "C", value: (currentSensorData?.comC_V ?? 0) * (currentSensorData?.comC_I ?? 0) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AiAlertEngine communityId={selectedCommunity} sensorData={currentSensorData} />
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl">Smart Solar Microgrid Management</CardTitle>
              {isLive && !isFirestoreLoading && (
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
              Monitor your solar system in real-time via Firestore
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
      
      {isLoading && (
         <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HardDrive />Connecting...</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Waiting for first data transmission from your ESP32 device for {selectedCommunity}...</p>
                <p className="text-xs text-muted-foreground mt-2">This can take up to 15 seconds after the device is powered on.</p>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
       <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Power</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{power.toFixed(2)} W</div>
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
            {isLoading ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{solarIrradiance.toFixed(0)} W/m²</div>
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
            {isLoading ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{batterySoc.toFixed(0)}%</div>
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
            {isLoading ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{voltage.toFixed(2)} V</div>
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
            {isLoading ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{current.toFixed(2)} A</div>
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
            {isLoading ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{temperature.toFixed(1)} °C</div>
                <p className="text-xs text-muted-foreground">Live battery temperature</p>
              </>
            }
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ESP32 Supply Voltage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> :
              <>
                <div className="text-2xl font-bold">{supplyVoltage.toFixed(2)} V</div>
                <p className="text-xs text-muted-foreground">Device's own power input</p>
              </>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardHeader>
          <CardTitle>Live Solar Generation</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] p-6 pt-0">
          {isLoading ? <Skeleton className="h-full w-full" /> : 
            <SolarGenerationChart value={solarGenerationValue} />
          }
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
                <CardTitle>Raw Firestore Document JSON</CardTitle>
                <CardDescription>
                  This is the raw, unfiltered JSON data from the latest document in the Firestore path <strong>/users/{selectedUserId}/esp32_data</strong>. It updates in real-time. Use this to debug the data your ESP32 is sending.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : currentSensorData ? (
                  <CodeBlock
                    code={JSON.stringify(currentSensorData, (key, value) => {
                      // Pretty-print Firestore Timestamps
                      if (value && value.seconds) {
                        return new Date(value.seconds * 1000).toISOString();
                      }
                      return value;
                    }, 2)}
                    language="json"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No data available at this path. Waiting for first transmission from the device.</p>
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
             {isLoading ? <Skeleton className="h-full w-full" /> :
                <CommunityDistributionChart data={communityDistributionData} />
             }
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Battery SOC</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 h-[250px] flex items-center justify-center">
             {isLoading ? <Skeleton className="h-full w-full" /> :
              <BatteryStateChart 
                value={batterySoc} 
                voltage={currentSensorData?.batteryV ?? 0}
                chargeRate={(currentSensorData?.batteryI ?? 0) / 100} // Assuming 100Ah battery for C-rate
                health={100 - Math.abs(temperature - 25)} // Simple health metric
              />
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

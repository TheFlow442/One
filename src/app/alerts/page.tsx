
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Tag } from 'lucide-react';

const placeholderAlerts = [
  {
    id: '1',
    title: 'High Battery Temperature',
    description: 'Battery temperature has exceeded the 40°C threshold. Current temperature is 42.5°C.',
    communityId: 'Community A',
    timestamp: '2024-05-23T14:30:00Z',
    status: 'new',
  },
  {
    id: '2',
    title: 'Inverter Underperformance',
    description: 'Inverter output is zero while solar irradiance is high (550 W/m^2). Check for inverter fault.',
    communityId: 'Community B',
    timestamp: '2024-05-23T11:15:00Z',
    status: 'new',
  },
  {
    id: '3',
    title: 'Unusual Voltage Spike',
    description: 'Inverter voltage spiked to 245V, which is above the safe threshold of 240V.',
    communityId: 'Community C',
    timestamp: '2024-05-22T18:05:00Z',
    status: 'acknowledged',
  },
];

const formatTimestamp = (isoString: string) => {
  try {
    const date = new Date(isoString);
    // Use a simple, non-locale-dependent format
    return date.toUTCString();
  } catch (e) {
    return 'Invalid date';
  }
};


export default function AlertsPage() {

  const alerts = placeholderAlerts;
  const isLoading = false; // Data is now static, so it's never loading.

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle /> Alerts</CardTitle>
          <CardDescription>Critical events and warnings from your microgrid are listed here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <Card key={alert.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-bold">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3"/>
                      {alert.communityId}
                    </Badge>
                  <Badge variant={alert.status === 'new' ? 'destructive' : 'secondary'}>{alert.status}</Badge>
                  {alert.status === 'new' && (
                    <Button variant="outline" disabled>Acknowledge</Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
             <div className="flex flex-col items-center justify-center text-center p-8 border-dashed border-2 rounded-lg">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">No Alerts</h3>
                <p className="text-muted-foreground">The system has not detected any issues.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

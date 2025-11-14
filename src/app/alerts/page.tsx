'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Tag } from 'lucide-react';
import { format } from 'date-fns';

// Static placeholder data to avoid Firebase issues and hydration errors.
const placeholderAlerts = [
  {
    id: '1',
    title: 'High Battery Temperature',
    description: 'Battery bank temperature has exceeded the 40°C threshold.',
    communityId: 'Community A',
    status: 'new' as 'new' | 'acknowledged',
    timestamp: '2024-07-29T10:30:00Z',
  },
  {
    id: '2',
    title: 'Inverter Underperformance',
    description: 'Inverter output is lower than expected for current irradiance levels.',
    communityId: 'Community B',
    status: 'new' as 'new' | 'acknowledged',
    timestamp: '2024-07-29T09:15:00Z',
  },
  {
    id: '3',
    title: 'Grid Voltage Spike',
    description: 'Unusual inverter voltage spike (> 240V) detected.',
    communityId: 'Community A',
    status: 'acknowledged' as 'new' | 'acknowledged',
    timestamp: '2024-07-28T18:05:00Z',
  },
];


export default function AlertsPage() {
  // We are now using placeholder data, so no Firebase hooks are needed here.
  const alerts = placeholderAlerts;
  const isLoading = false; // Data is static, so it's never loading.

  const handleAcknowledge = (alertId: string) => {
    // This is now a placeholder function.
    alert(`In a real app, this would acknowledge alert ${alertId}.`);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle /> Alerts</CardTitle>
          <CardDescription>Critical events and warnings from your microgrid are listed here. (Displaying placeholder data)</CardDescription>
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
                      {format(new Date(alert.timestamp), 'PPpp')}
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
                    <Button variant="outline" onClick={() => handleAcknowledge(alert.id)}>Acknowledge</Button>
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


'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Tag } from 'lucide-react';
import { format } from 'date-fns';

// Placeholder data for alerts
const placeholderAlerts = [
  {
    id: 'alert-1',
    title: 'High Battery Temperature Detected',
    description: 'Battery bank temperature for Community A is currently at 48°C, which is above the safe operating threshold.',
    timestamp: new Date(),
    communityId: 'Community A',
    status: 'new',
  },
  {
    id: 'alert-2',
    title: 'Inverter Underperformance',
    description: 'Inverter for Community C is producing 30% less power than expected based on current solar irradiance.',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 90 minutes ago
    communityId: 'Community C',
    status: 'new',
  },
  {
    id: 'alert-3',
    title: 'Acknowledged: Voltage Spike',
    description: 'A transient voltage spike was detected on the main bus. The system recovered automatically.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    communityId: 'Community B',
    status: 'acknowledged',
  },
];


export default function AlertsPage() {
  const alerts = placeholderAlerts;
  const isLoading = false; // No longer loading from a database

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle /> Alerts</CardTitle>
          <CardDescription>Critical events and warnings from your microgrid are listed here. (Currently displaying placeholder data).</CardDescription>
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
                      {alert.timestamp ? format(alert.timestamp, 'PPpp') : 'No timestamp'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3"/>
                      {alert.communityId}
                    </Badge>
                  <Badge variant={alert.status === 'new' ? 'destructive' : 'secondary'}>{alert.status}</Badge>
                  <Button variant="outline">Acknowledge</Button>
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

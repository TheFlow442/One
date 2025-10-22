
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function AlertsPage() {
  const alerts = [
    {
      id: 'alert-1',
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
      timestamp: '10/15/2025, 1:26:01 PM',
    },
    {
      id: 'alert-2',
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
      timestamp: '10/15/2025, 12:14:55 PM',
    },
    {
      id: 'alert-3',
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
      timestamp: '10/15/2025, 7:48:59 AM',
    },
    {
      id: 'alert-4',
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
      timestamp: '10/15/2025, 7:33:59 AM',
    },
    {
      id: 'alert-5',
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
      timestamp: '10/15/2025, 12:03:05 AM',
    },
    {
      id: 'alert-6',
      title: 'Transient voltage spike',
      description: 'Edge node detected spike',
      timestamp: '10/14/2025, 6:37:13 PM',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle /> Alerts</CardTitle>
          <CardDescription>Critical events and warnings from your microgrid are listed here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="font-bold">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="destructive">warning</Badge>
                <Button variant="outline">Acknowledge</Button>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

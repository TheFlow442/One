
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Tag } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function AlertsPage() {
  const firestore = useFirestore();

  const alertsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'alerts'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: alerts, isLoading } = useCollection<any>(alertsQuery);

  const handleAcknowledge = (alertId: string) => {
    // In a real app, you would update the alert status in Firestore.
    // For now, it's just a placeholder action.
    alert(`Acknowledged alert ID: ${alertId}`);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle /> Alerts</CardTitle>
          <CardDescription>Critical events and warnings from your microgrid are listed here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-6" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </Card>
            ))
          ) : alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <Card key={alert.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  <div>
                    <p className="font-bold">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.timestamp ? format(alert.timestamp.toDate(), 'PPpp') : 'No timestamp'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3"/>
                      {alert.communityId}
                    </Badge>
                  <Badge variant={alert.status === 'new' ? 'destructive' : 'secondary'}>{alert.status}</Badge>
                  <Button variant="outline" onClick={() => handleAcknowledge(alert.id)}>Acknowledge</Button>
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

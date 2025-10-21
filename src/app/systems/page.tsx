import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, BatteryCharging, Gauge, Activity, TowerControl, Layers } from 'lucide-react';

export default function SystemsPage() {
  const systems = [
    {
      name: 'PV Array',
      icon: <Sun className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: '1.4 kW',
      lastUpdate: '30s ago',
    },
    {
      name: 'Battery Bank',
      icon: <BatteryCharging className="h-6 w-6 text-muted-foreground" />,
      status: 'charging',
      kpi: 'SOC 76%',
      lastUpdate: '30s ago',
    },
    {
      name: 'Inverter',
      icon: <Gauge className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: 'AC 230V',
      lastUpdate: '30s ago',
    },
    {
      name: 'Controller',
      icon: <Activity className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: 'MPPT ok',
      lastUpdate: '30s ago',
    },
    {
      name: 'Comms',
      icon: <Layers className="h-6 w-6 text-muted-foreground" />,
      status: 'online',
      kpi: 'LoRa/MQTT',
      lastUpdate: '30s ago',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {systems.map((system) => (
        <Card key={system.name}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {system.icon}
                <CardTitle className="text-lg font-medium">{system.name}</CardTitle>
              </div>
              <Badge variant={system.status === 'charging' ? 'warning' : 'success'}>
                {system.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">KPI: {system.kpi}</p>
            <p className="text-xs text-muted-foreground mt-1">Last update: {system.lastUpdate}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

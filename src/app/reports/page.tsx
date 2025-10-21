'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { DailyGenerationLoadsChart } from '@/components/reports/daily-generation-loads-chart';
import { CapacityFactorChart } from '@/components/reports/capacity-factor-chart';
import { ReportGeneratorForm } from '@/components/reports/report-generator-form';

const dailyGenerationLoadsData = [
  { day: 'D1', communityA: 0.7, communityB: 0.8, communityC: 0.6, generation: 1.2 },
  { day: 'D2', communityA: 0.64, communityB: 0.93, communityC: 0.64, generation: 1.43 },
  { day: 'D3', communityA: 0.8, communityB: 0.85, communityC: 0.7, generation: 1.5 },
  { day: 'D4', communityA: 0.75, communityB: 0.7, communityC: 0.6, generation: 1.3 },
  { day: 'D5', communityA: 0.9, communityB: 0.95, communityC: 0.8, generation: 1.6 },
  { day: 'D6', communityA: 0.85, communityB: 0.9, communityC: 0.75, generation: 1.55 },
  { day: 'D7', communityA: 0.8, communityB: 0.82, communityC: 0.7, generation: 1.5 },
  { day: 'D8', communityA: 1.1, communityB: 1.0, communityC: 0.9, generation: 1.1 },
  { day: 'D9', communityA: 1.0, communityB: 1.05, communityC: 0.95, generation: 1.2 },
  { day: 'D10', communityA: 1.1, communityB: 1.1, communityC: 0.9, generation: 1.3 },
  { day: 'D11', communityA: 1.2, communityB: 1.0, communityC: 0.8, generation: 1.1 },
  { day: 'D12', communityA: 0.9, communityB: 0.8, communityC: 0.7, generation: 0.9 },
  { day: 'D13', communityA: 1.0, communityB: 0.9, communityC: 0.8, generation: 1.2 },
  { day: 'D14', communityA: 1.1, communityB: 1.0, communityC: 0.9, generation: 1.4 },
];

export default function ReportsPage() {
  const handleExport = () => {
    const headers = ["Day", "Community A", "Community B", "Community C", "Generation (kWh)"];
    const csvRows = [
      headers.join(','),
      ...dailyGenerationLoadsData.map(row => 
        [row.day, row.communityA, row.communityB, row.communityC, row.generation].join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'daily_generation_loads.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daily Generation & Loads (14 days)</CardTitle>
          <Button variant="outline" onClick={handleExport}>
            <Upload className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="h-[400px]">
          <DailyGenerationLoadsChart />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportGeneratorForm />
        <Card>
          <CardHeader>
            <CardTitle>Capacity Factor (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <CapacityFactorChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

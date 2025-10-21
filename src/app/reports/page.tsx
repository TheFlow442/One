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

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daily Generation & Loads (14 days)</CardTitle>
          <Button variant="outline">
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

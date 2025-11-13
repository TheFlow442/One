'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Upload, Loader2 } from 'lucide-react';
import { DailyGenerationLoadsChart } from '@/components/reports/daily-generation-loads-chart';
import { CapacityFactorChart } from '@/components/reports/capacity-factor-chart';
import { ReportGeneratorForm } from '@/components/reports/report-generator-form';
import { generateReportSummary, GenerateReportSummaryOutput, GenerateReportSummaryInputSchema } from '@/ai/flows/generate-report-summary-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { subDays, format, startOfDay } from 'date-fns';

const communityUserIds = {
  'Community A': '0nkCeSiTQbcTEhEMcUhQwYT39U72',
  'Community B': 'F0jfqt20cPXSqJ2nsJeZtseO1qn2',
  'Community C': '7yV6eXu6A1ReAXdtqOVMWszmiOD2',
};

// This is a server-side check that gets passed to the client
const isApiKeySet = process.env.NEXT_PUBLIC_IS_GEMINI_API_KEY_SET === 'true';

export default function ReportsPage() {
  const [report, setReport] = useState<GenerateReportSummaryOutput | null>(null);
  const [chartData, setChartData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  const fetchAndProcessData = async () => {
    if (!firestore) {
      alert("Firestore is not available. Please try again.");
      return null;
    }

    const endDate = new Date();
    const startDate = subDays(endDate, 14);

    const aggregatedData: { [key: string]: { generation: number; communityA: number; communityB: number; communityC: number } } = {};

    for (let i = 0; i < 14; i++) {
        const date = subDays(endDate, i);
        const dayKey = format(date, 'yyyy-MM-dd');
        aggregatedData[dayKey] = { generation: 0, communityA: 0, communityB: 0, communityC: 0 };
    }

    for (const [communityName, userId] of Object.entries(communityUserIds)) {
        const q = query(
            collection(firestore, `users/${userId}/esp32_data`),
            where('timestamp', '>=', startDate),
            where('timestamp', '<=', endDate)
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const timestamp = (data.timestamp as Timestamp).toDate();
            const dayKey = format(timestamp, 'yyyy-MM-dd');

            if (aggregatedData[dayKey]) {
                const consumption = ((data.comA_V || 0) * (data.comA_I || 0)) +
                                    ((data.comB_V || 0) * (data.comB_I || 0)) +
                                    ((data.comC_V || 0) * (data.comC_I || 0));

                const generation = (data.panelV || 0) * (data.panelI || 0);

                if(communityName === 'Community A') aggregatedData[dayKey].communityA += consumption / 1000;
                if(communityName === 'Community B') aggregatedData[dayKey].communityB += consumption / 1000;
                if(communityName === 'Community C') aggregatedData[dayKey].communityC += consumption / 1000;

                // We'll use Community A's panel data as representative of the whole grid generation
                if (communityName === 'Community A') {
                    aggregatedData[dayKey].generation += generation / 1000;
                }
            }
        });
    }

    const formattedChartData = Object.entries(aggregatedData).map(([day, values]) => ({
      day: format(new Date(day), 'd'), // Format to just the day number
      ...values
    })).reverse(); // Reverse to have the oldest day first

    setChartData(formattedChartData);
    return formattedChartData;
};


  const handleGenerateReport = async () => {
    if (!isApiKeySet) {
      alert("Please set your Gemini API key in the .env file to use this feature.");
      return;
    }
    setIsLoading(true);
    setReport(null);
    try {
      const processedData = await fetchAndProcessData();
      if (!processedData) {
        throw new Error("Failed to fetch or process data from Firestore.");
      }

      const aiInput = {
        timeframe: 'Last 14 Days',
        data: processedData.map(d => ({
          day: d.day,
          communityA: parseFloat(d.communityA.toFixed(2)),
          communityB: parseFloat(d.communityB.toFixed(2)),
          communityC: parseFloat(d.communityC.toFixed(2)),
          generation: parseFloat(d.generation.toFixed(2))
        }))
      };

      const result = await generateReportSummary(aiInput);
      setReport(result);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('An error occurred while generating the report. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!chartData) {
        alert("Please generate a report first to fetch the data for export.");
        return;
    }
    const headers = ["Day", "Community A (kWh)", "Community B (kWh)", "Community C (kWh)", "Generation (kWh)"];
    const csvRows = [
      headers.join(','),
      ...chartData.map(row => 
        [row.day, row.communityA.toFixed(2), row.communityB.toFixed(2), row.communityC.toFixed(2), row.generation.toFixed(2)].join(',')
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
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportGeneratorForm onGenerate={handleGenerateReport} isLoading={isLoading} />
        <Card>
          <CardHeader>
            <CardTitle>Capacity Factor (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <CapacityFactorChart />
          </CardContent>
        </Card>
      </div>

       {(isLoading || report) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot /> AI-Generated Summary
            </CardTitle>
            <CardDescription>
              An intelligent analysis of the grid performance over the last 14 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && !report ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : (
              report && (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.summary}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daily Generation & Loads (14 days)</CardTitle>
            {isLoading && !chartData && <CardDescription>Fetching and processing data...</CardDescription>}
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!chartData || isLoading}>
            <Upload className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="h-[400px]">
            {isLoading && !chartData ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : chartData ? (
                 <DailyGenerationLoadsChart data={chartData} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-muted-foreground">Click "Generate" to fetch data and view the report.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

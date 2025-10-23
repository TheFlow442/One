'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  Line,
} from 'recharts';

type ChartData = {
  day: string;
  consumption: number;
  generation: number;
};

interface CommunityConsumptionGenerationChartProps {
  data: ChartData[];
}

export function CommunityConsumptionGenerationChart({ data }: CommunityConsumptionGenerationChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart 
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: -10,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="day"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis
          yAxisId="left"
          orientation="left"
          stroke="hsl(var(--chart-2))"
          tick={{ fill: 'hsl(var(--chart-2))', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(var(--chart-2))' }}
          tickLine={{ stroke: 'hsl(var(--chart-2))' }}
          label={{ value: 'Consumption (kWh)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="hsl(var(--primary))"
          tick={{ fill: 'hsl(var(--primary))', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(var(--primary))' }}
          tickLine={{ stroke: 'hsl(var(--primary))' }}
          label={{ value: 'Generation (kWh)', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--card))' }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-popover p-4 rounded-lg border shadow-sm text-popover-foreground">
                  <p className="font-bold text-base mb-2">{`Day: ${label}`}</p>
                  <p style={{ color: 'hsl(var(--chart-2))' }}>{`Consumption: ${payload[0].value} kWh`}</p>
                  <p style={{ color: 'hsl(var(--primary))' }}>{`Generation: ${payload[1].value} kWh`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Bar dataKey="consumption" yAxisId="left" name="Consumption" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="generation" yAxisId="right" name="Generation" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

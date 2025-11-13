
"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface SolarGenerationChartProps {
  value: number;
}

export function SolarGenerationChart({ value }: SolarGenerationChartProps) {
  const chartData = [{ name: "Live", value: value }];
  const maxValue = Math.max(1000, value * 1.2); // Ensure Y-axis has a reasonable max

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <YAxis 
          dataKey="value"
          domain={[0, maxValue]} 
          tickFormatter={(val) => `${val.toFixed(0)} W`}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={false}
          tickLine={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--card))' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-popover p-2 rounded-lg border shadow-sm text-popover-foreground">
                  <p className="font-bold">{`${payload[0].value?.toFixed(2)} W`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={100} />
      </BarChart>
    </ResponsiveContainer>
  )
}

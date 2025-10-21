"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const chartData = [
  { name: "Week 1", value: 190 },
  { name: "Week 2", value: 280 },
  { name: "Week 3", value: 210 },
  { name: "Week 4", value: 240 },
  { name: "Week 5", value: 180 },
  { name: "Week 6", value: 205 },
];

export function WeeklyEnergyUsageChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="name"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis 
          tickFormatter={(value) => `${value} kWh`}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--card))' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-popover p-2 rounded-lg border shadow-sm text-popover-foreground">
                  <p className="font-bold">{`${payload[0].value} kWh`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

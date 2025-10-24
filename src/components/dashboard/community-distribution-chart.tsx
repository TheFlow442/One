"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const chartData = [
  { name: "A", value: 6 },
  { name: "B", value: 4 },
  { name: "C", value: 3 },
];

export function CommunityDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="name"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={(value) => `${value} kW`}
          domain={[0, 8]}
          ticks={[0, 4, 8]}
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
                  <p className="font-bold">{`${payload[0].value} kW`}</p>
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

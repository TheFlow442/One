"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const chartData = [
  { name: "Week 1", month: "May", value: 190 },
  { name: "Week 2", month: "May", value: 280 },
  { name: "Week 3", month: "May", value: 210 },
  { name: "Week 4", month: "May", value: 240 },
  { name: "Week 5", month: "June", value: 180 },
  { name: "Week 6", month: "June", value: 205 },
];

export function WeeklyEnergyUsageChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="name"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
        />
        <XAxis 
          dataKey="month" 
          axisLine={false} 
          tickLine={false} 
          xAxisId="month"
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 14, fontWeight: 'bold' }} 
          tickFormatter={(value, index) => {
            const currentMonth = chartData[index].month;
            const prevMonth = index > 0 ? chartData[index - 1].month : null;
            return currentMonth !== prevMonth ? currentMonth : '';
          }}
          interval={0}
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

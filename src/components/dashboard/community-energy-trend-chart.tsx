"use client"

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const chartData = [
    { day: "D1", value: 0.6 },
    { day: "D2", value: 0.65 },
    { day: "D3", value: 0.85 },
    { day: "D4", value: 0.65 },
    { day: "D5", value: 0.95 },
    { day: "D6", value: 0.96 },
    { day: "D7", value: 0.8 },
    { day: "D8", value: 0.85 },
    { day: "D9", value: 0.95 },
    { day: "D10", value: 1.05 },
    { day: "D11", value: 1.05 },
    { day: "D12", value: 0.6 },
    { day: "D13", value: 0.9 },
    { day: "D14", value: 1.0 },
]

export function CommunityEnergyTrendChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="day" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis
          domain={[0, 1.2]}
          ticks={[0, 0.3, 0.6, 0.9, 1.2]}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
        />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: "3 3" }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-popover p-2 rounded-lg border shadow-sm text-popover-foreground">
                  <p className="font-bold">{`${payload[0].value} kW`}</p>
                   <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

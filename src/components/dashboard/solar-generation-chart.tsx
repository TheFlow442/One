"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { time: "00", value: 0.05 },
  { time: "03", value: 0.1 },
  { time: "06", value: 0.4 },
  { time: "09", value: 0.7 },
  { time: "12", value: 0.75 },
  { time: "15", value: 0.6 },
  { time: "18", value: 0.2 },
  { time: "21", value: 0.05 },
]

export function SolarGenerationChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="time" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          domain={[0, 0.8]} 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
        />
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const value = (payload[0].value as number) * 25; // Simulate kW
              return (
                <div className="bg-popover p-2 rounded-lg border shadow-sm text-popover-foreground">
                  <p className="font-bold text-lg">{`${Math.round(value)} kW`}</p>
                  <p className="text-sm text-muted-foreground">{`${payload[0].value}`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

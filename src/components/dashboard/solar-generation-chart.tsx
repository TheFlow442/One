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
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <YAxis 
          dataKey="value"
          domain={[0, 0.8]} 
          ticks={[0.35, 0.7]}
          tickFormatter={(value) => value.toFixed(2)}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={false}
          tickLine={false}
        />
        <XAxis
          dataKey="time"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: "3 3" }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-popover p-2 rounded-lg border shadow-sm text-popover-foreground">
                  <p className="font-bold">{`${payload[0].value} kW`}</p>
                   <p className="text-sm text-muted-foreground">{label}:00</p>
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

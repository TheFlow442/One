'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
    { month: 'Jan', factor: 0.8 },
    { month: 'Feb', factor: 0.85 },
    { month: 'Mar', factor: 0.95 },
    { month: 'Apr', factor: 1.1 },
    { month: 'May', factor: 1.35 },
    { month: 'Jun', factor: 1.5 },
    { month: 'Jul', factor: 1.6 },
    { month: 'Aug', factor: 1.55 },
    { month: 'Sep', factor: 1.4 },
    { month: 'Oct', factor: 1.2 },
    { month: 'Nov', factor: 1.0 },
    { month: 'Dec', factor: 0.9 },
];

export function CapacityFactorChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: -20,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis 
            dataKey="month" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis
            domain={[0, 1.8]}
            ticks={[0, 0.45, 0.9, 1.35, 1.8]}
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
                        <p className="font-bold">{`Factor: ${payload[0].value}`}</p>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        </div>
                    );
                }
                return null;
            }}
        />
        <Area type="monotone" dataKey="factor" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCapacity)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

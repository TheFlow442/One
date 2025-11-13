'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';


interface ChartProps {
    data: any[];
}

export function DailyGenerationLoadsChart({ data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: -20,
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
          domain={[0, 'dataMax']}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickLine={{ stroke: 'hsl(var(--border))' }}
          tickFormatter={(value) => `${value.toFixed(1)} kWh`}
        />
        <Tooltip
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                return (
                    <div className="bg-popover p-4 rounded-lg border shadow-sm text-popover-foreground">
                        <p className="font-bold text-base mb-2">{`Day ${label}`}</p>
                        {payload.map((entry, index) => (
                            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
                                {`${entry.name}: ${entry.value?.toFixed(2)} kWh`}
                            </p>
                        ))}
                    </div>
                );
                }
                return null;
          }}
        />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
          formatter={(value, entry) => {
            const { color } = entry;
            return <span style={{ color }}>{value}</span>;
          }}
        />
        <Line type="monotone" dataKey="communityA" name="Community A" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="communityB" name="Community B" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="communityC" name="Community C" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="generation" name="Generation" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

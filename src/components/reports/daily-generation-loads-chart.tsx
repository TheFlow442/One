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

const data = [
  { day: 'D1', communityA: 0.7, communityB: 0.8, communityC: 0.6, generation: 1.2 },
  { day: 'D2', communityA: 0.64, communityB: 0.93, communityC: 0.64, generation: 1.43 },
  { day: 'D3', communityA: 0.8, communityB: 0.85, communityC: 0.7, generation: 1.5 },
  { day: 'D4', communityA: 0.75, communityB: 0.7, communityC: 0.6, generation: 1.3 },
  { day: 'D5', communityA: 0.9, communityB: 0.95, communityC: 0.8, generation: 1.6 },
  { day: 'D6', communityA: 0.85, communityB: 0.9, communityC: 0.75, generation: 1.55 },
  { day: 'D7', communityA: 0.8, communityB: 0.82, communityC: 0.7, generation: 1.5 },
  { day: 'D8', communityA: 1.1, communityB: 1.0, communityC: 0.9, generation: 1.1 },
  { day: 'D9', communityA: 1.0, communityB: 1.05, communityC: 0.95, generation: 1.2 },
  { day: 'D10', communityA: 1.1, communityB: 1.1, communityC: 0.9, generation: 1.3 },
  { day: 'D11', communityA: 1.2, communityB: 1.0, communityC: 0.8, generation: 1.1 },
  { day: 'D12', communityA: 0.9, communityB: 0.8, communityC: 0.7, generation: 0.9 },
  { day: 'D13', communityA: 1.0, communityB: 0.9, communityC: 0.8, generation: 1.2 },
  { day: 'D14', communityA: 1.1, communityB: 1.0, communityC: 0.9, generation: 1.4 },
];

export function DailyGenerationLoadsChart() {
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
                    <div className="bg-popover p-4 rounded-lg border shadow-sm text-popover-foreground">
                        <p className="font-bold text-base mb-2">{label}</p>
                        {payload.map((entry, index) => (
                            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
                                {`${entry.name}: ${entry.value?.toFixed(2)}`}
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
        <Line type="monotone" dataKey="generation" name="Generation (kWh)" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

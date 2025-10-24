'use client';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

const data = [{ name: 'Health', value: 92, fill: 'hsl(var(--primary))' }];

export function BatteryStateChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadialBarChart
        innerRadius="70%"
        outerRadius="100%"
        barSize={12}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background
          dataKey="value"
          cornerRadius={10}
          className="fill-primary"
        />
        <text
          x="50%"
          y="70%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-5xl font-bold fill-foreground"
        >
          {data[0].value}%
        </text>
         <text
          x="50%"
          y="95%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-muted-foreground"
        >
          Voltage: 51.8V | Charge Rate: 0.4C | Health Index: 92%
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

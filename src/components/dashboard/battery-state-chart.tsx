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
    <ResponsiveContainer width="100%" height={150}>
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
          y="75%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-3xl font-bold fill-foreground"
        >
          {data[0].value}%
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

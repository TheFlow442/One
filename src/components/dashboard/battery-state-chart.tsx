
'use client';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

interface BatteryStateChartProps {
    value: number;
    voltage: number;
    chargeRate: number;
    health: number;
}

export function BatteryStateChart({ value, voltage, chargeRate, health }: BatteryStateChartProps) {
  const data = [{ name: 'SOC', value: value, fill: 'hsl(var(--primary))' }];

  return (
    <ResponsiveContainer width="100%" height="100%">
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
          {data[0].value.toFixed(0)}%
        </text>
         <text
          x="50%"
          y="95%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-muted-foreground"
        >
          {`Voltage: ${voltage.toFixed(1)}V | Charge Rate: ${chargeRate.toFixed(2)}C | Health: ${health.toFixed(0)}%`}
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

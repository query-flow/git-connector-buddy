import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartComponentProps {
  data: Record<string, any>[];
  config: {
    xAxis?: { label: string; name: string };
    yAxis?: { label: string; name: string };
    colors: string[];
  };
}

export function BarChartComponent({ data, config }: BarChartComponentProps) {
  if (!data || data.length === 0) return null;

  const xKey = config.xAxis?.label || Object.keys(data[0])[0];
  const yKey = config.yAxis?.label || Object.keys(data[0])[1];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="hsl(var(--border))" />
        <XAxis
          dataKey={xKey}
          label={{
            value: config.xAxis?.name || xKey,
            position: 'insideBottom',
            offset: -5,
          }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          label={{
            value: config.yAxis?.name || yKey,
            angle: -90,
            position: 'insideLeft',
          }}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--foreground))',
          }}
        />
        <Legend />
        <Bar
          dataKey={yKey}
          fill={config.colors[0] || 'hsl(var(--primary))'}
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

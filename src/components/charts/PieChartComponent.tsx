import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PieChartComponentProps {
  data: Record<string, any>[];
  config: {
    xAxis?: { label: string };
    yAxis?: { label: string };
    colors: string[];
  };
}

export function PieChartComponent({ data, config }: PieChartComponentProps) {
  if (!data || data.length === 0) return null;

  const nameKey = config.xAxis?.label || Object.keys(data[0])[0];
  const valueKey = config.yAxis?.label || Object.keys(data[0])[1];

  const pieData = data.map(item => ({
    name: item[nameKey],
    value: item[valueKey],
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={config.colors[index % config.colors.length] || `hsl(${index * 360 / pieData.length}, 70%, 50%)`}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            color: 'hsl(var(--foreground))',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

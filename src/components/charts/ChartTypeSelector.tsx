import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
} from 'lucide-react';
import { ChartType } from '@/types/charts';

const chartTypes = [
  { value: 'bar' as const, label: 'Barras', icon: BarChart3 },
  { value: 'line' as const, label: 'Linha', icon: LineChart },
  { value: 'pie' as const, label: 'Pizza', icon: PieChart },
  { value: 'scatter' as const, label: 'Dispersão', icon: ScatterChart },
  { value: 'area' as const, label: 'Área', icon: AreaChart },
];

interface ChartTypeSelectorProps {
  current: ChartType;
  onChange: (type: ChartType) => void;
}

export function ChartTypeSelector({ current, onChange }: ChartTypeSelectorProps) {
  const CurrentIcon = chartTypes.find(t => t.value === current)?.icon || BarChart3;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Tipo de Gráfico</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {chartTypes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onChange(value)}
            className={current === value ? 'bg-accent' : ''}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { ChartSpec, ChartType, ChartData, isChartSpec } from '@/types/charts';
import { ChartTypeSelector } from './ChartTypeSelector';
import { BarChartComponent } from './BarChartComponent';
import { LineChartComponent } from './LineChartComponent';
import { PieChartComponent } from './PieChartComponent';
import { ScatterChartComponent } from './ScatterChartComponent';
import { AreaChartComponent } from './AreaChartComponent';

interface ChartRendererProps {
  spec: ChartData;
  onChangeType?: (newType: ChartType) => void;
}

export function ChartRenderer({ spec, onChangeType }: ChartRendererProps) {
  // Verificar se é formato antigo (PNG) ou novo (JSON spec)
  if (!isChartSpec(spec)) {
    // Formato antigo - PNG base64
    const legacyChart = spec as { mime: string; base64: string };
    return (
      <Card>
        <CardContent className="pt-6">
          <img
            src={`data:${legacyChart.mime};base64,${legacyChart.base64}`}
            alt="Chart"
            className="w-full rounded"
          />
        </CardContent>
      </Card>
    );
  }

  // Formato novo - JSON spec com gráficos interativos
  const chartSpec = spec as ChartSpec;
  const [currentType, setCurrentType] = useState<ChartType>(chartSpec.type);

  const chartComponents = {
    bar: BarChartComponent,
    line: LineChartComponent,
    pie: PieChartComponent,
    scatter: ScatterChartComponent,
    area: AreaChartComponent,
  };

  const ChartComponent = chartComponents[currentType] || BarChartComponent;

  const handleChangeType = (newType: ChartType) => {
    setCurrentType(newType);
    onChangeType?.(newType);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>{chartSpec.config.title}</CardTitle>
            {chartSpec.recommendation_reason && (
              <CardDescription className="flex items-center gap-2 mt-2">
                <Lightbulb className="w-4 h-4" />
                {chartSpec.recommendation_reason}
              </CardDescription>
            )}
          </div>

          <ChartTypeSelector
            current={currentType}
            onChange={handleChangeType}
          />
        </div>
      </CardHeader>

      <CardContent>
        <ChartComponent
          data={chartSpec.data}
          config={chartSpec.config}
        />
      </CardContent>
    </Card>
  );
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area';

export interface ChartConfig {
  title: string;
  xAxis?: {
    label: string;
    name: string;
  };
  yAxis?: {
    label: string;
    name: string;
  };
  colors: string[];
  theme: 'light' | 'dark';
}

export interface ChartSpec {
  type: ChartType;
  data: Record<string, any>[];
  config: ChartConfig;
  recommendation_reason?: string;
}

// Formato antigo (PNG) para compatibilidade
export interface LegacyChartPNG {
  mime: string;
  base64: string;
}

export type ChartData = ChartSpec | LegacyChartPNG;

// Helper para detectar tipo
export function isChartSpec(data: ChartData): data is ChartSpec {
  return 'type' in data && 'data' in data && Array.isArray((data as ChartSpec).data);
}

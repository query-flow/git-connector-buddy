import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { ChartData } from '@/types/charts';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  table?: {
    columns: string[];
    rows: any[][];
  };
  insights?: {
    summary: string;
    chart?: ChartData;
  };
}

export const MessageBubble = ({ role, content, sql, table, insights }: MessageBubbleProps) => {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-primary text-primary-foreground rounded-2xl px-4 py-3">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <Card className="max-w-[85%] p-4 space-y-4">
        {content && (
          <p className="text-sm whitespace-pre-wrap text-foreground">{content}</p>
        )}
        
        {table && <DataTable columns={table.columns} rows={table.rows} />}
        
        {sql && (
          <div className="bg-muted rounded-lg p-3 overflow-x-auto">
            <p className="text-xs font-mono text-muted-foreground mb-1">SQL Query:</p>
            <code className="text-xs font-mono">{sql}</code>
          </div>
        )}
        
        {insights?.chart && (
          <ChartRenderer spec={insights.chart} />
        )}
      </Card>
    </div>
  );
};
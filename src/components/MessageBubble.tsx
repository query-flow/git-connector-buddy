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
  console.log('[MessageBubble] Rendering:', { role, content, hasTable: !!table, hasSql: !!sql, hasInsights: !!insights, table, insights });

  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4 animate-in slide-in-from-right duration-300">
        <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl px-5 py-3 shadow-sm">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-in slide-in-from-left duration-300">
      <Card className="w-full max-w-full border-border/50 shadow-sm">
        <div className="p-6 space-y-6">
          {content && (
            <div className="prose prose-sm max-w-none">
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground m-0">{content}</p>
            </div>
          )}
          
          {table && (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <DataTable columns={table.columns} rows={table.rows} />
            </div>
          )}
          
          {sql && (
            <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">SQL Query</p>
              <code className="text-xs font-mono text-foreground block">{sql}</code>
            </div>
          )}
          
          {insights?.chart && (
            <div className="mt-2">
              <ChartRenderer spec={insights.chart} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
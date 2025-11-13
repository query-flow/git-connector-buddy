import { Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreamStage } from '@/hooks/useQueryStream';

interface Stage {
  id: StreamStage;
  label: string;
}

const STAGES: Stage[] = [
  { id: 'selecting_schema', label: 'Selecting schema' },
  { id: 'analyzing_intent', label: 'Analyzing question' },
  { id: 'generating_sql', label: 'Generating SQL' },
  { id: 'executing_sql', label: 'Executing query' },
  { id: 'enriching', label: 'Generating insights' },
];

interface LoadingStagesProps {
  currentStage?: StreamStage;
  progress?: number;
  message?: string;
  error?: string;
}

export const LoadingStages = ({
  currentStage = 'started',
  progress = 0,
  message,
  error
}: LoadingStagesProps) => {
  // Find current stage index
  const currentStageIndex = STAGES.findIndex(s => s.id === currentStage);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  // Use provided progress or calculate from stage
  const displayProgress = progress > 0 ? progress : ((activeIndex + 1) / STAGES.length) * 100;

  return (
    <div className="space-y-3">
      {/* Error message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Current stage indicator */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {error ? (
          <div className="h-4 w-4 text-destructive">✕</div>
        ) : (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        <span>{message || STAGES[activeIndex]?.label || 'Processing'}...</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            error ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      {/* Stage pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGES.map((stage, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isPending = index > activeIndex;

          return (
            <div
              key={stage.id}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-300',
                isCurrent && 'bg-primary text-primary-foreground',
                isCompleted && 'bg-muted text-muted-foreground',
                isPending && 'bg-muted/50 text-muted-foreground/50'
              )}
            >
              {isCompleted && <CheckCircle className="h-3 w-3" />}
              {isCurrent && <Loader2 className="h-3 w-3 animate-spin" />}
              <span className={cn(isCompleted && 'line-through')}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

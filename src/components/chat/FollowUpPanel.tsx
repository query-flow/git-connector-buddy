import { Lightbulb } from 'lucide-react';

interface FollowUpPanelProps {
  suggestions: string[];
  onAsk: (question: string) => void;
}

export function FollowUpPanel({ suggestions, onAsk }: FollowUpPanelProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-6 p-4 rounded-lg border border-dashed border-border bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium">Continue explorando</h4>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onAsk(q)}
            className="px-3 py-1.5 rounded-md border border-border
                       hover:bg-background hover:border-primary
                       transition-all text-sm text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

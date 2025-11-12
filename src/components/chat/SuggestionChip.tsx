interface SuggestionChipProps {
  question: string;
  badge?: string;
  onClick: () => void;
}

export function SuggestionChip({ question, badge, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                 border border-border bg-background hover:bg-accent
                 transition-colors text-sm text-left"
    >
      <span>{question}</span>
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium whitespace-nowrap">
          {badge}
        </span>
      )}
    </button>
  );
}

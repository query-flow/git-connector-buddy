import { History, Sparkles } from 'lucide-react';
import { SuggestionsResponse } from '@/types/suggestions';
import { SuggestionChip } from './SuggestionChip';

interface ChatEmptyStateProps {
  suggestions: SuggestionsResponse | undefined;
  onAsk: (question: string) => void;
  isLoading?: boolean;
}

export function ChatEmptyState({ suggestions, onAsk, isLoading }: ChatEmptyStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground mt-4">Carregando sugestões...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Como posso ajudar?</h2>
        <p className="text-muted-foreground">
          Faça uma pergunta sobre seus dados ou escolha uma sugestão abaixo
        </p>
      </div>

      {/* Seção: Você costuma perguntar */}
      {suggestions?.personalized && suggestions.personalized.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Você costuma perguntar</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.personalized.map((s) => (
              <SuggestionChip
                key={s.question}
                question={s.question}
                badge={s.metadata.frequency ? `${s.metadata.frequency}x` : undefined}
                onClick={() => onAsk(s.question)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Seção: Perguntas Comuns */}
      {suggestions?.static && suggestions.static.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Perguntas Comuns</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.static.map((q) => (
              <SuggestionChip
                key={q}
                question={q}
                onClick={() => onAsk(q)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

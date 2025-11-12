export interface QuestionSuggestion {
  question: string;
  source: {
    type: "personalized" | "popular";
    reason: string;
  };
  metadata: {
    frequency?: number;
    last_asked?: string;
    total_count?: number;
    user_count?: number;
  };
}

export interface SuggestionsResponse {
  static: string[];
  personalized: QuestionSuggestion[];
  popular: QuestionSuggestion[];
  schema_name: string | null;
}

export interface UserQueryStats {
  total_queries: number;
  avg_duration_ms: number;
  most_used_schema: string | null;
}

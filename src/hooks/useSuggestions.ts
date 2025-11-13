import { useQuery } from '@tanstack/react-query';
import { SuggestionsResponse } from '@/types/suggestions';

interface UseSuggestionsOptions {
  schema?: string;
  includePersonalized?: boolean;
  includeOrgPopular?: boolean;
  enabled?: boolean;
  accessToken?: string;
}

export function useSuggestions(options: UseSuggestionsOptions = {}) {
  const {
    schema,
    includePersonalized = true,
    includeOrgPopular = false,
    enabled = true,
    accessToken,
  } = options;

  return useQuery<SuggestionsResponse>({
    queryKey: ['suggestions', schema, includePersonalized, includeOrgPopular],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (schema) params.append('schema', schema);
      params.append('include_personalized', String(includePersonalized));
      params.append('include_org_popular', 'false');

      const response = await fetch(`/api/suggestions?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
    enabled: enabled && !!accessToken,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
}

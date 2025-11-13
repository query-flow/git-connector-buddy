import { useState, useEffect, useRef } from 'react';

export type StreamStage =
  | 'idle'
  | 'started'
  | 'selecting_schema'
  | 'analyzing_intent'
  | 'generating_sql'
  | 'executing_sql'
  | 'enriching'
  | 'completed'
  | 'error';

export interface StreamProgress {
  stage: StreamStage;
  progress: number;
  message?: string;
  data?: any;
  error?: string;
}

export interface QueryResult {
  status: string;
  sql?: string;
  columns?: string[];
  rows?: any[][];
  insights?: {
    summary?: string;
    chart?: any;
  };
  metadata?: any;
}

interface UseQueryStreamOptions {
  enabled?: boolean;
  onComplete?: (result: QueryResult) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: StreamProgress) => void;
}

export const useQueryStream = (
  question: string,
  accessToken: string,
  maxLines: number = 100,
  enrich: boolean = true,
  options: UseQueryStreamOptions = {}
) => {
  const { enabled = true, onComplete, onError, onProgress } = options;

  const [currentStage, setCurrentStage] = useState<StreamStage>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !question || !accessToken) {
      // Reset state when disabled
      setIsStreaming(false);
      setCurrentStage('idle');
      setProgress(0);
      setMessage('');
      return;
    }

    const executeStream = async () => {
      // Reset all state before starting new stream
      setIsStreaming(true);
      setCurrentStage('started');
      setProgress(0);
      setMessage('');
      setError(null);
      setResult(null);

      // Create abort controller for cleanup
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/perguntar_org_stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            pergunta: question,
            max_linhas: maxLines,
            enrich: enrich,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // Read stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep incomplete message in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              // Parse SSE format: "event: name\ndata: {...}"
              const eventMatch = line.match(/^event: (.+)\ndata: (.+)$/s);

              if (eventMatch) {
                const [, eventType, dataStr] = eventMatch;
                const data = JSON.parse(dataStr);

                console.log('[SSE Event]', {
                  eventType,
                  stage: data.stage,
                  progress: data.progress,
                  message: data.message,
                  timestamp: new Date().toISOString()
                });

                // Handle special events
                if (eventType === 'result') {
                  // Final result event - process and complete
                  setResult(data.data);
                  if (data.data && onComplete) {
                    onComplete(data.data);
                  }
                  continue; // Continue to process 'done' event
                }

                if (eventType === 'error') {
                  const errorMsg = data.error || 'Unknown error occurred';
                  setError(errorMsg);
                  if (onError) {
                    onError(errorMsg);
                  }
                  continue;
                }

                if (eventType === 'done') {
                  // Stream completed - just break the loop
                  break;
                }

                // Update state for progress events
                const stage = data.stage as StreamStage;
                setCurrentStage(stage);
                setProgress(data.progress || 0);
                setMessage(data.message || '');

                // Call progress callback
                if (onProgress) {
                  onProgress({
                    stage,
                    progress: data.progress || 0,
                    message: data.message,
                    data: data.data,
                    error: data.error,
                  });
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE message:', line, parseError);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            console.log('Stream aborted by user');
          } else {
            const errorMsg = err.message || 'Stream connection failed';
            setError(errorMsg);
            if (onError) {
              onError(errorMsg);
            }
          }
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    };

    executeStream();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, question, accessToken, maxLines, enrich]);

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return {
    currentStage,
    progress,
    message,
    isStreaming,
    result,
    error,
    cancel,
  };
};

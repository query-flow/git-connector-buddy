import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MessageBubble } from '@/components/MessageBubble';
import { Sidebar } from '@/components/Sidebar';
import { Send, Zap } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  table?: {
    columns: string[];
    rows: any[][];
  };
  insights?: {
    summary: string;
    chart?: {
      mime: string;
      base64: string;
    };
  };
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { accessToken, userName, orgName } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/perguntar_org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          pergunta: input,
          max_linhas: 100,
          enrich: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === 'success') {
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.insights?.summary || 'Query executed successfully',
            sql: data.sql,
            table: data.columns && data.rows ? { columns: data.columns, rows: data.rows } : undefined,
            insights: data.insights,
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else if (data.status === 'schema_error') {
          const assistantMessage: Message = {
            role: 'assistant',
            content: `${data.message}\n\nSuggestions:\n${data.suggestions?.join('\n') || ''}`,
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        throw new Error(data.detail || 'Failed to execute query');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{orgName || 'QueryFlow'}</h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-xs font-medium">
              <Zap className="h-3 w-3" />
              Quick Mode
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {userName || 'User'}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">Ask anything about your data</h2>
                <p className="text-muted-foreground">
                  Type your question in natural language below
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={index} {...message} />
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                Processing your question...
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button type="submit" size="icon" className="h-[60px] w-[60px]" disabled={loading || !input.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
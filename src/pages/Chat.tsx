import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MessageBubble } from '@/components/MessageBubble';
import { Sidebar } from '@/components/Sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Zap, Save, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSuggestions } from '@/hooks/useSuggestions';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { FollowUpPanel } from '@/components/chat/FollowUpPanel';

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
  suggestedQuestions?: string[];
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const { accessToken, userName, orgName } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  
  // Buscar sugestões
  const { data: suggestions, isLoading: loadingSuggestions } = useSuggestions({
    enabled: messages.length === 0 && !conversationId,
    accessToken,
  });

  // Load conversation history if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0 && showWarning && !conversationId) {
      const timer = setTimeout(() => setShowWarning(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, showWarning, conversationId]);

  const loadConversation = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setConversationTitle(data.conversation.title);
        // Map backend message format to frontend format
        const loadedMessages: Message[] = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          sql: msg.sql_executed,
          table: msg.table_data,
          insights: msg.insights,
        }));
        setMessages(loadedMessages);
      } else {
        throw new Error(data.detail || 'Failed to load conversation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load conversation',
        variant: 'destructive',
      });
      navigate('/chat'); // Redirect to quick mode on error
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (messages.length === 0) return;

    setSaving(true);
    try {
      // Create a new conversation
      const createResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: messages[0]?.content.substring(0, 50) || 'Nova Conversa',
        }),
      });

      if (!createResponse.ok) throw new Error('Failed to create conversation');

      const { conversation_id } = await createResponse.json();

      // Save each message to the conversation
      for (const message of messages) {
        await fetch(`/api/conversations/${conversation_id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            role: message.role,
            content: message.content,
            sql: message.sql,
            table_data: message.table,
            insights: message.insights,
          }),
        });
      }

      toast({
        title: 'Conversa salva!',
        description: 'Sua conversa foi salva com sucesso',
      });

      // Navigate to the saved conversation
      navigate(`/conversations/${conversation_id}`);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a conversa',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAskQuestion = (question: string) => {
    setInput(question);
    // Trigger submit automaticamente
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Use different endpoints for saved conversations vs quick mode
      const endpoint = conversationId
        ? `/api/conversations/${conversationId}/ask`
        : '/api/perguntar_org';

      const response = await fetch(endpoint, {
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
            suggestedQuestions: data.suggested_questions,
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
            <h1 className="text-lg font-semibold">{conversationTitle || orgName || 'QueryFlow'}</h1>
            {!conversationId && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-xs font-medium">
                <Zap className="h-3 w-3" />
                Quick Mode
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {messages.length > 0 && !conversationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveConversation}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Conversa'}
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              {userName || 'User'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length > 0 && showWarning && !conversationId && (
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Atenção:</strong> No Quick Mode, suas conversas não são salvas automaticamente.
                  Use o botão "Salvar Conversa" no topo para preservar este histórico.
                </AlertDescription>
              </Alert>
            )}
            {messages.length === 0 ? (
              <ChatEmptyState
                suggestions={suggestions}
                onAsk={handleAskQuestion}
                isLoading={loadingSuggestions}
              />
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index}>
                    <MessageBubble {...message} />
                    {message.role === 'assistant' && message.suggestedQuestions && (
                      <FollowUpPanel
                        suggestions={message.suggestedQuestions}
                        onAsk={handleAskQuestion}
                      />
                    )}
                  </div>
                ))}
              </>
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
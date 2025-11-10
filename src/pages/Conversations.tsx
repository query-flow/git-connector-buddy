import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { accessToken, userName, orgName } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations?limit=50&offset=0', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
      } else {
        throw new Error(data.detail || 'Failed to load conversations');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: 'Nova Conversa',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/chat/${data.id}`);
      } else {
        throw new Error(data.detail || 'Failed to create conversation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create conversation',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setConversations(conversations.filter(c => c.id !== id));
        toast({
          title: 'Success',
          description: 'Conversa deletada com sucesso',
        });
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete conversation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete conversation',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <h1 className="text-lg font-semibold">{orgName || 'QueryFlow'}</h1>
          <div className="text-sm text-muted-foreground">
            {userName || 'User'}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Minhas Conversas</h2>
                <p className="text-muted-foreground mt-1">
                  Histórico de conversas com contexto
                </p>
              </div>
              <Button onClick={handleCreateConversation}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : conversations.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Crie uma conversa para começar a fazer perguntas com contexto
                </p>
                <Button onClick={handleCreateConversation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Conversa
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{conversation.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{conversation.message_count} mensagens</span>
                          <span>•</span>
                          <span>Atualizado em {formatDate(conversation.updated_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(conversation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conversa e todas as mensagens serão permanentemente deletadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteConversation(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

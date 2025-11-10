import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileText, Trash2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface Document {
  id: number;
  title: string;
  metadata_json: {
    type?: string;
    content?: string;
    meta?: any;
  };
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { accessToken, userName, orgName } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
      } else {
        throw new Error(data.detail || 'Failed to load documents');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast({
        title: 'Error',
        description: 'Preencha o título e selecione um arquivo',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch('/api/documents/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Documento enviado com sucesso',
        });
        setShowUploadDialog(false);
        setTitle('');
        setFile(null);
        loadDocuments();
      } else {
        throw new Error(data.detail || 'Failed to upload document');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id));
        toast({
          title: 'Success',
          description: 'Documento deletado com sucesso',
        });
      } else {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete document');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
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
                <h2 className="text-2xl font-semibold">Documentos da Organização</h2>
                <p className="text-muted-foreground mt-1">
                  Contexto de negócio para queries mais precisas
                </p>
              </div>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Documento
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : documents.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum documento ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Envie documentos (PDF, DOCX, TXT) com contexto do seu negócio
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enviar Primeiro Documento
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h3 className="font-semibold">{doc.title}</h3>
                          {doc.metadata_json?.type && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Tipo: {doc.metadata_json.type}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(doc.id)}
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

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
            <DialogDescription>
              Envie documentos com contexto do seu negócio (PDF, DOCX, TXT)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Dicionário de Dados - Vendas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOCX, TXT
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será permanentemente deletado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
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

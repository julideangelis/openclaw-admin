'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Save, FileText, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKSPACE_FILES = ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'HEARTBEAT.md', 'BOOTSTRAP.md', 'IDENTITY.md', 'USER.md', 'MEMORY.md', 'SHIELD.md'];

export default function KnowledgePage() {
  const { api, connected } = useAdmin();
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);

  const loadFiles = async () => {
    try {
      const data = await api.listWorkspaceFiles();
      setFiles(data.files || WORKSPACE_FILES.map(f => ({ name: f, path: f })));
    } catch {
      setFiles(WORKSPACE_FILES.map(f => ({ name: f, path: f })));
    }
  };

  const loadSkills = async () => {
    try {
      const data = await api.listSkills();
      setSkills(data.skills || []);
    } catch {}
  };

  useEffect(() => {
    if (connected) {
      loadFiles();
      loadSkills();
    }
  }, [connected]);

  const openFile = async (name: string) => {
    try {
      setLoading(true);
      setSelectedFile(name);
      const data = await api.readWorkspaceFile(name);
      setContent(data.content || '');
    } catch (e: any) {
      setContent('');
      toast.error('Error al abrir archivo', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    try {
      setSaving(true);
      await api.writeWorkspaceFile(selectedFile, content);
      toast.success(`${selectedFile} guardado`);
    } catch (e: any) {
      toast.error('Error al guardar archivo', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (!connected) return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Skeleton className="h-8 w-[200px]" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[600px] w-full rounded-xl lg:col-span-3" />
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Knowledge Base</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File list */}
        <Card className="flex flex-col h-[calc(100vh-12rem)]">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm uppercase text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Workspace Files
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {(files.length > 0 ? files : WORKSPACE_FILES.map(f => ({ name: f, path: f }))).map((f) => (
                <button
                  key={f.name}
                  onClick={() => openFile(f.name)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedFile === f.name
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    {f.name}
                  </div>
                </button>
              ))}

              {skills.length > 0 && (
                <>
                  <div className="pt-4 pb-2 px-3">
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase">Skills</h2>
                  </div>
                  {skills.map((s: any) => (
                    <div key={s.name} className="px-3 py-1.5 text-sm text-muted-foreground flex items-center justify-between">
                      <span>{s.name}</span>
                      <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 rounded">{s.source}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-3 flex flex-col h-[calc(100vh-12rem)]">
          {selectedFile ? (
            <>
              <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-mono">{selectedFile}</CardTitle>
                <Button onClick={saveFile} disabled={saving} size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {loading ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : (
                  <Textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full h-full border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm resize-none bg-background text-foreground"
                    placeholder="Escribe el contenido aquí..."
                    aria-label={`Contenido de ${selectedFile}`}
                  />
                )}
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <FileText className="h-12 w-12 text-muted" />
              <p>Seleccioná un archivo para editar</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

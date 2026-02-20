'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { OPENCLAW_TOOLS } from '@/lib/types';
import { getAvailableModels, getDefaultWorkspace, getPrimaryModel } from '@/lib/config-selectors';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Plus, Trash2, Edit2, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface AgentForm {
  id: string;
  name: string;
  model: string;
  workspace: string;
  enabled: boolean;
  tools: { allow: string[]; deny: string[] };
  subagents: { allowAgents: string[]; maxConcurrent: number };
  sandbox: { mode: string; scope: string };
}

const emptyForm: AgentForm = {
  id: '', name: '', model: 'claude-sonnet-4-20250514', workspace: '',
  enabled: true,
  tools: { allow: [], deny: [] },
  subagents: { allowAgents: [], maxConcurrent: 4 },
  sandbox: { mode: 'off', scope: 'session' },
};

export default function AgentsPage() {
  const { api, connected, config, configLoading, updateConfigLocal, reloadConfig } = useAdmin();
  const [editing, setEditing] = useState<AgentForm | null>(null);
  const [saving, setSaving] = useState(false);

  const agents = Array.isArray(config?.agents?.list) ? config.agents.list : [];
  const defaultModel = getPrimaryModel(config) || emptyForm.model;
  const defaultWorkspace = getDefaultWorkspace(config);
  const availableModels = getAvailableModels(config);
  const loading = configLoading && !config;

  const makeEmptyForm = (): AgentForm => ({
    ...emptyForm,
    model: defaultModel,
    workspace: defaultWorkspace,
  });

  const toForm = (agent: any): AgentForm => {
    return {
      ...makeEmptyForm(),
      ...agent,
      model: agent?.model || defaultModel,
      workspace: agent?.workspace || defaultWorkspace,
      tools: { allow: [], deny: [], ...agent?.tools },
      subagents: { allowAgents: [], maxConcurrent: 4, ...agent?.subagents },
      sandbox: { mode: 'off', scope: 'session', ...agent?.sandbox },
    };
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.id) {
      toast.error('El ID del agente es obligatorio');
      return;
    }
    try {
      setSaving(true);
      await api.updateAgent(editing);
      if (config) {
        const nextAgents = Array.isArray(config?.agents?.list) ? [...config.agents.list] : [];
        const idx = nextAgents.findIndex((a: any) => a.id === editing.id);
        if (idx >= 0) {
          nextAgents[idx] = editing;
        } else {
          nextAgents.push(editing);
        }
        updateConfigLocal({
          ...config,
          agents: {
            ...(config.agents || {}),
            list: nextAgents,
          },
        });
      }
      setEditing(null);
      toast.success('Agente guardado exitosamente');
      await reloadConfig();
    } catch (e: any) {
      toast.error('Error al guardar agente', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(`¿Eliminar agente "${id}"?`)) return;
    try {
      setSaving(true);
      await api.deleteAgent(id);
      if (config) {
        const nextAgents = Array.isArray(config?.agents?.list)
          ? config.agents.list.filter((a: any) => a.id !== id)
          : [];
        updateConfigLocal({
          ...config,
          agents: {
            ...(config.agents || {}),
            list: nextAgents,
          },
        });
      }
      toast.success('Agente eliminado');
      await reloadConfig();
    } catch (e: any) {
      toast.error('Error al eliminar agente', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (list: 'allow' | 'deny', tool: string) => {
    if (!editing) return;
    const current = editing.tools[list];
    const updated = current.includes(tool) ? current.filter(t => t !== tool) : [...current, tool];
    setEditing({ ...editing, tools: { ...editing.tools, [list]: updated } });
  };

  if (!connected) return (
    <div className="p-8">
      <Skeleton className="h-8 w-[200px] mb-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Agentes</h1>
        <Button onClick={() => setEditing(makeEmptyForm())} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Agente</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : agents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No hay agentes</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mb-6">
            Aún no has configurado ningún agente. Comienza creando tu primer agente de IA.
          </p>
          <Button onClick={() => setEditing(makeEmptyForm())} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Crear Agente
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent: any) => (
            <Card key={agent.id} className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{agent.name || agent.id}</CardTitle>
                    <p className="text-sm font-mono text-muted-foreground">{agent.id}</p>
                  </div>
                  <Badge variant={agent.enabled !== false ? "default" : "secondary"} className={agent.enabled !== false ? "bg-green-600 hover:bg-green-700" : ""}>
                    {agent.enabled !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  <span className="truncate">{agent.model || defaultModel || 'default'}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                  onClick={() => setEditing(toForm(agent))}
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="gap-2"
                  onClick={() => remove(agent.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{editing?.id ? 'Editar Agente' : 'Nuevo Agente'}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6 py-4">
            {editing && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="id">ID</Label>
                    <Input id="id" value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} disabled={!!agents.find(a => a.id === editing.id)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      list="available-models"
                      value={editing.model}
                      onChange={e => setEditing({ ...editing, model: e.target.value })}
                      placeholder={defaultModel}
                    />
                    {availableModels.length > 0 && (
                      <datalist id="available-models">
                        {availableModels.map((modelId) => (
                          <option key={modelId} value={modelId} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workspace">Workspace</Label>
                    <Input
                      id="workspace"
                      value={editing.workspace}
                      onChange={e => setEditing({ ...editing, workspace: e.target.value })}
                      placeholder={defaultWorkspace || 'Ej: /var/www'}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tools Allow (Permitidas)</Label>
                  <div className="flex flex-wrap gap-2">
                    {OPENCLAW_TOOLS.map(tool => (
                      <Badge 
                        key={tool} 
                        variant={editing.tools.allow.includes(tool) ? "default" : "outline"}
                        className={editing.tools.allow.includes(tool) ? "bg-green-600 hover:bg-green-700 cursor-pointer" : "cursor-pointer hover:bg-accent"}
                        onClick={() => toggleTool('allow', tool)}
                        aria-label={`Permitir herramienta ${tool}`}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tools Deny (Denegadas)</Label>
                  <div className="flex flex-wrap gap-2">
                    {OPENCLAW_TOOLS.map(tool => (
                      <Badge 
                        key={tool} 
                        variant={editing.tools.deny.includes(tool) ? "destructive" : "outline"}
                        className={editing.tools.deny.includes(tool) ? "cursor-pointer" : "cursor-pointer hover:bg-accent"}
                        onClick={() => toggleTool('deny', tool)}
                        aria-label={`Denegar herramienta ${tool}`}
                      >
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sandboxMode">Sandbox Mode</Label>
                    <Select value={editing.sandbox.mode} onValueChange={(val) => setEditing({ ...editing, sandbox: { ...editing.sandbox, mode: val } })}>
                      <SelectTrigger id="sandboxMode">
                        <SelectValue placeholder="Seleccionar modo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="non-main">Non-Main</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrent">Max Concurrent Subagents</Label>
                    <Input id="maxConcurrent" type="number" min={1} max={20} value={editing.subagents.maxConcurrent} onChange={e => setEditing({ ...editing, subagents: { ...editing.subagents, maxConcurrent: parseInt(e.target.value) || 4 } })} />
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t bg-muted/40">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

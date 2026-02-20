'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { OPENCLAW_TOOLS } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PermissionsPage() {
  const { api, connected, config, configLoading, updateConfigLocal, reloadConfig } = useAdmin();
  const [saving, setSaving] = useState(false);
  const agents = Array.isArray(config?.agents?.list) ? config.agents.list : [];
  const loading = configLoading && !config;

  const toggleTool = async (agentIdx: number, tool: string, list: 'allow' | 'deny') => {
    if (!config) return;
    const nextAgents = Array.isArray(config?.agents?.list) ? [...config.agents.list] : [];
    const agent = { ...nextAgents[agentIdx] };
    if (!agent.tools) agent.tools = { allow: [], deny: [] };
    if (!agent.tools[list]) agent.tools[list] = [];

    const current = agent.tools[list] as string[];
    agent.tools[list] = current.includes(tool) ? current.filter((t: string) => t !== tool) : [...current, tool];

    // If we are allowing, we should remove from deny, and vice versa to prevent conflict
    const oppositeList = list === 'allow' ? 'deny' : 'allow';
    if (agent.tools[oppositeList]?.includes(tool)) {
      agent.tools[oppositeList] = agent.tools[oppositeList].filter((t: string) => t !== tool);
    }

    nextAgents[agentIdx] = agent;
    updateConfigLocal({
      ...config,
      agents: {
        ...(config.agents || {}),
        list: nextAgents,
      },
    });

    try {
      setSaving(true);
      await api.updateAgent(agent);
      await reloadConfig();
    } catch (e: any) {
      toast.error(`Error al actualizar permisos de ${agent.name || agent.id}`, { description: e.message });
      await reloadConfig();
    } finally {
      setSaving(false);
    }
  };

  if (!connected) return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-[600px] w-full rounded-xl" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Permisos</h1>
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-[600px] w-full rounded-xl" />
      ) : agents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No hay agentes para configurar</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Crea un agente primero para poder configurar sus permisos de herramientas.
          </p>
        </Card>
      ) : (
        <div className="rounded-md border bg-card relative overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[200px] font-semibold sticky left-0 bg-muted/50 z-20 backdrop-blur-sm">
                    Herramienta
                  </TableHead>
                  {agents.map((a: any) => (
                    <TableHead key={a.id} className="text-center min-w-[120px]">
                      {a.name || a.id}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {OPENCLAW_TOOLS.map((tool) => (
                  <TableRow key={tool} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs sticky left-0 bg-card z-10 backdrop-blur-sm">
                      {tool}
                    </TableCell>
                    {agents.map((agent: any, idx: number) => {
                      const allowed = agent.tools?.allow?.includes(tool);
                      const denied = agent.tools?.deny?.includes(tool);
                      return (
                        <TableCell key={agent.id} className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant={allowed ? "default" : "outline"}
                              size="icon"
                              className={`h-7 w-7 rounded-sm ${allowed ? "bg-green-600 hover:bg-green-700" : ""}`}
                              onClick={() => toggleTool(idx, tool, 'allow')}
                              aria-label={`Permitir ${tool} para ${agent.name || agent.id}`}
                              disabled={saving}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={denied ? "destructive" : "outline"}
                              size="icon"
                              className="h-7 w-7 rounded-sm"
                              onClick={() => toggleTool(idx, tool, 'deny')}
                              aria-label={`Denegar ${tool} para ${agent.name || agent.id}`}
                              disabled={saving}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

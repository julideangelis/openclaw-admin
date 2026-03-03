'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Plus, Trash2, Edit2, Play, Calendar, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function CronPage() {
  const { api, connected } = useAdmin();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.listCronJobs();
      const list = data.jobs;
      setJobs(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error('Error al cargar cron jobs', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (connected) load(); }, [connected]);

  const run = async (jobId: string) => {
    if (running[jobId]) return;
    try {
      setRunning(prev => ({ ...prev, [jobId]: true }));
      await api.runCronJob(jobId);
      toast.success('Cron job ejecutado manualmente');
    } catch (e: any) {
      toast.error('Error al ejecutar cron job', { description: e.message });
    } finally {
      setRunning(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const toggle = async (jobId: string) => {
    try {
      await api.toggleCronJob(jobId);
      toast.success('Estado actualizado');
      load();
    } catch (e: any) {
      toast.error('Error al cambiar estado', { description: e.message });
    }
  };

  const remove = async (jobId: string) => {
    if (!confirm(`¿Eliminar job "${jobId}"?`)) return;
    try {
      await api.deleteCronJob(jobId);
      toast.success('Cron job eliminado');
      load();
    } catch (e: any) {
      toast.error('Error al eliminar cron job', { description: e.message });
    }
  };

  const save = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      if (editing._isNew) {
        const { _isNew, ...job } = editing;
        await api.createCronJob(job);
        toast.success('Cron job creado');
      } else {
        await api.updateCronJob(editing);
        toast.success('Cron job guardado');
      }
      setEditing(null);
      load();
    } catch (e: any) {
      toast.error('Error al guardar cron job', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const updatePayload = (field: string, value: string) => {
    setEditing({ ...editing, payload: { ...editing.payload, [field]: value } });
  };

  const updateDelivery = (field: string, value: string) => {
    setEditing({
      ...editing,
      payload: {
        ...editing.payload,
        delivery: { ...editing.payload?.delivery, [field]: value },
      },
    });
  };

  if (!connected) return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Skeleton className="h-8 w-[200px]" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cron Jobs</h1>
        <Button onClick={() => setEditing({
          _isNew: true, name: '', enabled: true,
          schedule: { kind: 'cron', expr: '0 9 * * *' },
          payload: { kind: 'agentTurn', agentId: '', message: '', delivery: { kind: 'whatsapp', to: '' } }
        })} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Job</span>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No hay cron jobs</h2>
          <p className="text-muted-foreground mt-2 max-w-sm mb-6">
            Programa tareas automáticas para que tus agentes las ejecuten en el futuro.
          </p>
          <Button onClick={() => setEditing({
            _isNew: true, name: '', enabled: true,
            schedule: { kind: 'cron', expr: '0 9 * * *' },
            payload: { kind: 'agentTurn', agentId: '', message: '', delivery: { kind: 'whatsapp', to: '' } }
          })} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Crear Cron Job
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <Card key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between md:justify-start gap-4">
                  <h3 className="font-semibold text-lg">{job.name || job.id}</h3>
                  <Badge variant={job.enabled ? "default" : "secondary"} className={job.enabled ? "bg-green-600 hover:bg-green-700" : ""}>
                    {job.enabled ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{job.schedule?.kind}: <span className="font-mono">{job.schedule?.expr || job.schedule?.everyMs || job.schedule?.atMs}</span></span>
                  </div>
                  {job.payload?.agentId && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">Agente:</span>
                      <span className="font-mono bg-muted px-1.5 rounded text-xs">{job.payload.agentId}</span>
                    </div>
                  )}
                  {job.payload?.delivery && (
                    <div className="flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      <span>{job.payload.delivery.kind} {job.payload.delivery.to && `→ ${job.payload.delivery.to}`}</span>
                    </div>
                  )}
                </div>
                
                {job.payload?.message && (
                  <p className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-3 py-0.5">
                    "{job.payload.message}"
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2 border-t pt-3 md:border-0 md:pt-0">
                <Button variant="outline" size="sm" onClick={() => run(job.id)} disabled={running[job.id]} className="gap-1.5 min-w-[90px]">
                  {running[job.id] ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{running[job.id] ? 'Iniciando...' : 'Ejecutar'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggle(job.id)}>
                  {job.enabled ? 'Desactivar' : 'Activar'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing({ ...job })}>
                  <Edit2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Editar</span>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => remove(job.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{editing?._isNew ? 'Nuevo Cron Job' : 'Editar Cron Job'}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6 py-4">
            {editing && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ej: Reporte Diario" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleKind">Schedule Kind</Label>
                    <Select value={editing.schedule?.kind || 'cron'} onValueChange={val => setEditing({ ...editing, schedule: { ...editing.schedule, kind: val } })}>
                      <SelectTrigger id="scheduleKind">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cron">Cron</SelectItem>
                        <SelectItem value="interval">Interval</SelectItem>
                        <SelectItem value="at">At</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleExpr">Expresión / Intervalo</Label>
                    <Input id="scheduleExpr" value={editing.schedule?.expr || ''} onChange={e => setEditing({ ...editing, schedule: { ...editing.schedule, expr: e.target.value } })} placeholder="0 9 * * *" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentId">Agent ID</Label>
                  <Input id="agentId" value={editing.payload?.agentId || ''} onChange={e => updatePayload('agentId', e.target.value)} placeholder="main" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryKind">Delivery Kind</Label>
                    <Select value={editing.payload?.delivery?.kind || 'whatsapp'} onValueChange={val => updateDelivery('kind', val)}>
                      <SelectTrigger id="deliveryKind">
                        <SelectValue placeholder="Medio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryTo">Destinatario</Label>
                    <Input id="deliveryTo" value={editing.payload?.delivery?.to || ''} onChange={e => updateDelivery('to', e.target.value)} placeholder="5491112345678@s.whatsapp.net" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Prompt (Mensaje)</Label>
                  <Textarea id="message" value={editing.payload?.message || ''} onChange={e => updatePayload('message', e.target.value)} placeholder="El prompt que ejecutará el agente..." className="min-h-[100px]" />
                </div>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t bg-muted/40">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="min-w-[100px]">
              {saving ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </>
              ) : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

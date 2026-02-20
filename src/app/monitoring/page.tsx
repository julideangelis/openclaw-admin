'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Activity, RotateCcw, Stethoscope, Terminal } from 'lucide-react';

export default function MonitoringPage() {
  const { api, connected } = useAdmin();
  const [logs, setLogs] = useState<any[]>([]);
  const [doctorOutput, setDoctorOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadLogs = async () => {
    try {
      const data = await api.getLogs(200);
      setLogs(data.logs || []);
    } catch (e: any) {
      toast.error('Error al cargar logs', { description: e.message });
    }
  };

  const runDoctor = async () => {
    try {
      setLoading(true);
      const data = await api.runDoctor();
      setDoctorOutput(data.output || 'Sin salida');
      toast.success('Diagnóstico completado');
    } catch (e: any) {
      setDoctorOutput(`Error: ${e.message}`);
      toast.error('Error al ejecutar doctor');
    } finally {
      setLoading(false);
    }
  };

  const restartGateway = async () => {
    if (!confirm('¿Reiniciar el Gateway?')) return;
    try {
      await api.restartGateway();
      toast.success('Gateway reiniciado');
    } catch (e: any) {
      toast.error('Error al reiniciar', { description: e.message });
    }
  };

  useEffect(() => {
    if (connected) loadLogs();
  }, [connected]);

  useEffect(() => {
    if (autoRefresh && connected) {
      pollRef.current = setInterval(loadLogs, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [autoRefresh, connected]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const levelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'text-destructive';
      case 'warn': case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-muted-foreground';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Monitoreo</h1>
        <div className="flex items-center gap-2">
          <Button onClick={runDoctor} disabled={loading} variant="secondary" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">{loading ? 'Ejecutando...' : 'Doctor'}</span>
          </Button>
          <Button onClick={restartGateway} variant="destructive" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reiniciar Gateway</span>
          </Button>
        </div>
      </div>

      {/* Doctor Output */}
      {doctorOutput && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="py-3 px-4 border-b border-primary/10">
            <CardTitle className="text-base flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">{doctorOutput}</pre>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      <Card className="flex flex-col h-[600px]">
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0 bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            Logs <span className="text-muted-foreground font-normal text-sm ml-1">({logs.length})</span>
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="auto-refresh" 
                checked={autoRefresh} 
                onCheckedChange={setAutoRefresh} 
                aria-label="Auto actualizar logs"
              />
              <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground cursor-pointer">Auto-refresh (5s)</Label>
            </div>
            <Button onClick={loadLogs} variant="ghost" size="sm" className="h-8 gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <ScrollArea className="flex-1 p-4 bg-background">
          <div className="font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 py-0.5 hover:bg-muted/50 rounded px-1 -mx-1">
                <span className="text-muted-foreground min-w-[170px] shrink-0">{log.timestamp || ''}</span>
                <span className={`min-w-[60px] font-medium shrink-0 ${levelColor(log.level)}`}>[{log.level || 'log'}]</span>
                <span className="text-foreground whitespace-pre-wrap break-all">{log.message || JSON.stringify(log)}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                <Activity className="h-12 w-12 text-muted" />
                <p>Sin logs registrados</p>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Download, Upload, Save, Settings as SettingsIcon, FileJson, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ConfigPage() {
  const { api, connected } = useAdmin();
  const [config, setConfig] = useState<any>(null);
  const [raw, setRaw] = useState('');
  const [tab, setTab] = useState<'visual' | 'raw'>('visual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getConfig();
      setConfig(data.config);
      setRaw(data.raw || JSON.stringify(data.config, null, 2));
    } catch (e: any) {
      toast.error('Error al cargar configuración', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (connected) load(); }, [connected]);

  const saveConfig = async () => {
    try {
      setSaving(true);
      if (tab === 'raw') {
        await api.setConfigRaw(raw);
      } else {
        await api.setConfig(config);
      }
      toast.success('Configuración guardada', { description: 'Gateway reiniciado exitosamente' });
      load();
    } catch (e: any) {
      toast.error('Error al guardar configuración', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const backup = () => {
    const blob = new Blob([raw || JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const restore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setRaw(content);
      try { setConfig(JSON.parse(content)); } catch {}
      setTab('raw');
      toast.success('Archivo cargado', { description: 'Revisa los cambios y guarda para aplicar' });
    };
    reader.readAsText(file);
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={backup} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Backup</span>
          </Button>
          <div className="relative">
            <input 
              type="file" 
              accept=".json" 
              onChange={restore} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              aria-label="Restaurar backup JSON"
              title="Restaurar backup"
            />
            <Button variant="outline" className="gap-2 pointer-events-none">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Restaurar</span>
            </Button>
          </div>
          <Button onClick={saveConfig} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar y Reiniciar'}</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border pb-px">
        <button 
          onClick={() => setTab('visual')} 
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2",
            tab === 'visual' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Visual
          </div>
        </button>
        <button 
          onClick={() => setTab('raw')} 
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2",
            tab === 'raw' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            JSON Raw
          </div>
        </button>
      </div>

      <Card className="h-[calc(100vh-16rem)] flex flex-col overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tab === 'raw' ? (
          <Textarea 
            value={raw} 
            onChange={e => setRaw(e.target.value)}
            className="w-full h-full border-0 rounded-none focus-visible:ring-0 p-6 font-mono text-sm resize-none bg-background" 
            aria-label="Editor de configuración JSON"
            spellCheck={false}
          />
        ) : config ? (
          <ScrollArea className="flex-1 p-6">
            <Accordion type="multiple" className="w-full space-y-4">
              {Object.entries(config).map(([section, value]) => (
                <AccordionItem key={section} value={section} className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2 font-mono text-base">
                      <FileJson className="h-4 w-4 text-muted-foreground" />
                      {section}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <pre className="text-xs text-muted-foreground font-mono bg-muted/50 p-4 rounded-md overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <FileJson className="h-12 w-12 text-muted" />
            <p>No se pudo parsear la configuración. Usá el editor JSON Raw.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

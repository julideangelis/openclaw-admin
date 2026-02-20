'use client';

import React from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, WifiOff, Wifi, Database } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionStatus() {
  const { connected, error, refreshStatus, reloadConfig, configLoading } = useAdmin();
  const [reloadingConfig, setReloadingConfig] = React.useState(false);

  const handleReloadConfig = async () => {
    try {
      setReloadingConfig(true);
      await reloadConfig();
      toast.success('Configuración recargada');
    } catch (e: unknown) {
      toast.error('Error al recargar configuración', {
        description: e instanceof Error ? e.message : 'Error desconocido',
      });
    } finally {
      setReloadingConfig(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-sm text-destructive max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
      
      <Badge 
        variant={connected ? "default" : "destructive"} 
        className={connected ? "bg-green-600 hover:bg-green-700 text-white" : ""}
      >
        {connected ? <Wifi className="w-3.5 h-3.5 mr-1.5" /> : <WifiOff className="w-3.5 h-3.5 mr-1.5" />}
        {connected ? 'SSH Conectado' : 'SSH Desconectado'}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={handleReloadConfig}
        aria-label="Recargar configuración"
        title="Recargar configuración"
        disabled={!connected || reloadingConfig || configLoading}
      >
        <Database className={`h-4 w-4 ${reloadingConfig ? 'animate-pulse' : ''}`} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => refreshStatus()}
        aria-label="Reintentar conexión SSH"
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

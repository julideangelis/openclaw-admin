'use client';

import React from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, WifiOff, Wifi } from 'lucide-react';

export function ConnectionStatus() {
  const { connected, error, refreshStatus } = useAdmin();

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
        onClick={() => refreshStatus()}
        aria-label="Reintentar conexión SSH"
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

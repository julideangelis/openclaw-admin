'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ConnectionStatus } from './connection-status';

const routeMap: Record<string, string> = {
  '/': 'Panel de Control',
  '/agents': 'Agentes',
  '/permissions': 'Permisos',
  '/cron': 'Cron Jobs',
  '/config': 'Configuración',
  '/knowledge': 'Knowledge Base',
  '/monitoring': 'Monitoreo',
};

export function Topbar() {
  const pathname = usePathname();
  const title = routeMap[pathname] || 'Panel de Control';

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <ConnectionStatus />
    </header>
  );
}

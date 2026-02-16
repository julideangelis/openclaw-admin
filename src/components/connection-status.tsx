'use client';

import React from 'react';
import { useAdmin } from '@/components/ssh-provider';

export function ConnectionStatus() {
  const { connected, error, refreshStatus } = useAdmin();

  return (
    <div className="flex items-center gap-3">
      <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-sm text-gray-300">
        {connected ? 'SSH Conectado' : 'SSH Desconectado'}
      </span>
      {error && (
        <span className="text-xs text-red-400 max-w-xs truncate" title={error}>
          {error}
        </span>
      )}
      <button
        onClick={() => refreshStatus()}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}

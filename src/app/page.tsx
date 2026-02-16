'use client';

import React from 'react';
import { useAdmin } from '@/components/ssh-provider';

export default function Dashboard() {
  const { connected, status, error, refreshStatus } = useAdmin();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🦞 OpenClaw Admin</h1>
        <button
          onClick={() => refreshStatus()}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!connected && !error && (
        <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
          Conectando al servidor via SSH...
        </div>
      )}

      {connected && status && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Estado del Gateway</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-xs">Estado</p>
                <p className="text-green-400 font-medium">Conectado</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Versión</p>
                <p className="text-white">{status.version || status.raw?.substring(0, 30) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Uptime</p>
                <p className="text-white">{status.uptime || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Modelo</p>
                <p className="text-white">{status.model || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Raw Status */}
          {status.raw && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-2">Status Raw</h2>
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-gray-900 p-4 rounded">
                {status.raw}
              </pre>
            </div>
          )}
        </div>
      )}

      {connected && !status && (
        <div className="text-gray-400 text-center py-12">Cargando status...</div>
      )}
    </div>
  );
}

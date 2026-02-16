'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/components/ssh-provider';

export default function MonitoringPage() {
  const { api, connected } = useAdmin();
  const [logs, setLogs] = useState<any[]>([]);
  const [doctorOutput, setDoctorOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadLogs = async () => {
    try {
      const data = await api.getLogs(200);
      setLogs(data.logs || []);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const runDoctor = async () => {
    try {
      setLoading(true);
      const data = await api.runDoctor();
      setDoctorOutput(data.output || 'Sin salida');
    } catch (e: any) {
      setDoctorOutput(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const restartGateway = async () => {
    if (!confirm('¿Reiniciar el Gateway?')) return;
    try {
      await api.restartGateway();
      setError('');
    } catch (e: any) {
      setError(e.message);
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
      case 'error': return 'text-red-400';
      case 'warn': case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (!connected) return <div className="p-6 text-gray-400">Esperando conexión SSH...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Monitoreo</h1>
        <div className="flex gap-2">
          <button onClick={runDoctor} disabled={loading}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50">
            {loading ? 'Ejecutando...' : 'Doctor'}
          </button>
          <button onClick={restartGateway}
            className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm">
            Reiniciar Gateway
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

      {/* Doctor Output */}
      {doctorOutput && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h2 className="text-white font-medium mb-2">Doctor</h2>
          <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap bg-gray-900 p-3 rounded">{doctorOutput}</pre>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-white font-medium">Logs ({logs.length})</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
              Auto-refresh (5s)
            </label>
            <button onClick={loadLogs} className="text-xs text-orange-400 hover:text-orange-300">Actualizar</button>
          </div>
        </div>
        <div className="h-[50vh] overflow-y-auto p-4 font-mono text-xs space-y-0.5">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-600 min-w-[180px]">{log.timestamp || ''}</span>
              <span className={`min-w-[50px] ${levelColor(log.level)}`}>[{log.level || 'log'}]</span>
              <span className="text-gray-300">{log.message || JSON.stringify(log)}</span>
            </div>
          ))}
          {logs.length === 0 && <div className="text-gray-500 text-center py-8">Sin logs</div>}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';

export default function ConfigPage() {
  const { api, connected } = useAdmin();
  const [config, setConfig] = useState<any>(null);
  const [raw, setRaw] = useState('');
  const [tab, setTab] = useState<'visual' | 'raw'>('visual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getConfig();
      setConfig(data.config);
      setRaw(data.raw || JSON.stringify(data.config, null, 2));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (connected) load(); }, [connected]);

  const saveConfig = async () => {
    try {
      setSaving(true);
      setError('');
      if (tab === 'raw') {
        await api.setConfigRaw(raw);
      } else {
        await api.setConfig(config);
      }
      setSuccess('Configuración guardada y Gateway reiniciado');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (e: any) {
      setError(e.message);
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
    };
    reader.readAsText(file);
  };

  if (!connected) return <div className="p-6 text-gray-400">Esperando conexión SSH...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <div className="flex gap-2">
          <button onClick={backup} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">Backup</button>
          <label className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm cursor-pointer">
            Restaurar
            <input type="file" accept=".json" onChange={restore} className="hidden" />
          </label>
          <button onClick={saveConfig} disabled={saving} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-900/50 border border-green-700 rounded text-green-300 text-sm">{success}</div>}

      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button onClick={() => setTab('visual')} className={`px-3 py-1.5 rounded text-sm ${tab === 'visual' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>Visual</button>
        <button onClick={() => setTab('raw')} className={`px-3 py-1.5 rounded text-sm ${tab === 'raw' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>JSON Raw</button>
      </div>

      {loading ? (
        <div className="text-gray-400">Cargando configuración...</div>
      ) : tab === 'raw' ? (
        <textarea value={raw} onChange={e => setRaw(e.target.value)}
          className="w-full h-[70vh] bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-300 font-mono text-sm resize-none" />
      ) : config ? (
        <div className="space-y-4">
          {Object.entries(config).map(([section, value]) => (
            <details key={section} className="bg-gray-800 border border-gray-700 rounded-lg">
              <summary className="px-4 py-3 text-white font-medium cursor-pointer hover:bg-gray-750">{section}</summary>
              <div className="px-4 pb-4">
                <pre className="text-gray-300 text-sm font-mono bg-gray-900 p-3 rounded overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="text-gray-400">No se pudo parsear la configuración. Usá el editor JSON Raw.</div>
      )}
    </div>
  );
}

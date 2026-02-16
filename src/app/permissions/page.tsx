'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { OPENCLAW_TOOLS } from '@/lib/types';

export default function PermissionsPage() {
  const { api, connected } = useAdmin();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.listAgents();
      setAgents(data.agents || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (connected) load(); }, [connected]);

  const toggleTool = async (agentIdx: number, tool: string, list: 'allow' | 'deny') => {
    const agent = { ...agents[agentIdx] };
    if (!agent.tools) agent.tools = { allow: [], deny: [] };
    if (!agent.tools[list]) agent.tools[list] = [];

    const current = agent.tools[list] as string[];
    agent.tools[list] = current.includes(tool) ? current.filter((t: string) => t !== tool) : [...current, tool];

    const updated = [...agents];
    updated[agentIdx] = agent;
    setAgents(updated);

    try {
      setSaving(true);
      await api.updateAgent(agent);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!connected) return <div className="p-6 text-gray-400">Esperando conexión SSH...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">🔐 Permisos</h1>
      {error && <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}
      {saving && <div className="text-orange-400 text-sm">Guardando...</div>}

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : agents.length === 0 ? (
        <div className="text-gray-500">No hay agentes configurados</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 py-2 px-3 sticky left-0 bg-gray-900">Tool</th>
                {agents.map((a: any) => (
                  <th key={a.id} className="text-center text-gray-400 py-2 px-2 min-w-[80px]">{a.name || a.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OPENCLAW_TOOLS.map(tool => (
                <tr key={tool} className="border-b border-gray-800">
                  <td className="text-gray-300 py-1.5 px-3 font-mono text-xs sticky left-0 bg-gray-900">{tool}</td>
                  {agents.map((agent: any, idx: number) => {
                    const allowed = agent.tools?.allow?.includes(tool);
                    const denied = agent.tools?.deny?.includes(tool);
                    return (
                      <td key={agent.id} className="text-center py-1.5 px-2">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => toggleTool(idx, tool, 'allow')}
                            className={`w-6 h-6 rounded text-xs ${allowed ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-500'}`}
                            title="Allow">✓</button>
                          <button onClick={() => toggleTool(idx, tool, 'deny')}
                            className={`w-6 h-6 rounded text-xs ${denied ? 'bg-red-700 text-red-200' : 'bg-gray-700 text-gray-500'}`}
                            title="Deny">✗</button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

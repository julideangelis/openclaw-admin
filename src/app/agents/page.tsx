'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';
import { OPENCLAW_TOOLS } from '@/lib/types';

interface AgentForm {
  id: string;
  name: string;
  model: string;
  workspace: string;
  enabled: boolean;
  tools: { allow: string[]; deny: string[] };
  subagents: { allowAgents: string[]; maxConcurrent: number };
  sandbox: { mode: string; scope: string };
}

const emptyForm: AgentForm = {
  id: '', name: '', model: 'claude-sonnet-4-20250514', workspace: '',
  enabled: true,
  tools: { allow: [], deny: [] },
  subagents: { allowAgents: [], maxConcurrent: 4 },
  sandbox: { mode: 'off', scope: 'session' },
};

export default function AgentsPage() {
  const { api, connected } = useAdmin();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AgentForm | null>(null);
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

  const save = async () => {
    if (!editing) return;
    try {
      await api.updateAgent(editing);
      setEditing(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(`¿Eliminar agente "${id}"?`)) return;
    try {
      await api.deleteAgent(id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggleTool = (list: 'allow' | 'deny', tool: string) => {
    if (!editing) return;
    const current = editing.tools[list];
    const updated = current.includes(tool) ? current.filter(t => t !== tool) : [...current, tool];
    setEditing({ ...editing, tools: { ...editing.tools, [list]: updated } });
  };

  if (!connected) return <div className="p-6 text-gray-400">Esperando conexión SSH...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">🤖 Agentes</h1>
        <button onClick={() => setEditing({ ...emptyForm })} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm">
          + Nuevo Agente
        </button>
      </div>

      {error && <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent: any) => (
            <div key={agent.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-medium">{agent.name || agent.id}</h3>
                  <p className="text-gray-400 text-xs">{agent.id}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${agent.enabled !== false ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {agent.enabled !== false ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-3">Modelo: {agent.model || 'default'}</p>
              <div className="flex gap-2">
                <button onClick={() => setEditing({ ...emptyForm, ...agent, tools: { allow: [], deny: [], ...agent.tools }, subagents: { allowAgents: [], maxConcurrent: 4, ...agent.subagents }, sandbox: { mode: 'off', scope: 'session', ...agent.sandbox } })} className="text-xs text-blue-400 hover:text-blue-300">
                  Editar
                </button>
                <button onClick={() => remove(agent.id)} className="text-xs text-red-400 hover:text-red-300">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
          {agents.length === 0 && <p className="text-gray-500 col-span-full">No hay agentes configurados</p>}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <h2 className="text-lg font-semibold text-white mb-4">{editing.id ? 'Editar Agente' : 'Nuevo Agente'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">ID</label>
                  <input value={editing.id} onChange={e => setEditing({ ...editing, id: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Nombre</label>
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Modelo</label>
                  <input value={editing.model} onChange={e => setEditing({ ...editing, model: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Workspace</label>
                  <input value={editing.workspace} onChange={e => setEditing({ ...editing, workspace: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Tools Allow</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {OPENCLAW_TOOLS.map(tool => (
                    <button key={tool} onClick={() => toggleTool('allow', tool)}
                      className={`text-xs px-2 py-1 rounded ${editing.tools.allow.includes(tool) ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-400'}`}>
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Tools Deny</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {OPENCLAW_TOOLS.map(tool => (
                    <button key={tool} onClick={() => toggleTool('deny', tool)}
                      className={`text-xs px-2 py-1 rounded ${editing.tools.deny.includes(tool) ? 'bg-red-800 text-red-200' : 'bg-gray-700 text-gray-400'}`}>
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Sandbox Mode</label>
                  <select value={editing.sandbox.mode} onChange={e => setEditing({ ...editing, sandbox: { ...editing.sandbox, mode: e.target.value } })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                    <option value="off">Off</option>
                    <option value="non-main">Non-Main</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Max Concurrent Subagents</label>
                  <input type="number" value={editing.subagents.maxConcurrent} onChange={e => setEditing({ ...editing, subagents: { ...editing.subagents, maxConcurrent: parseInt(e.target.value) || 4 } })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={save} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

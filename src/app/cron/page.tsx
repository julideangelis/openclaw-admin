'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';

export default function CronPage() {
  const { api, connected } = useAdmin();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.listCronJobs();
      const list = data.jobs;
      setJobs(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (connected) load(); }, [connected]);

  const run = async (jobId: string) => {
    try {
      await api.runCronJob(jobId);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggle = async (jobId: string) => {
    try {
      await api.toggleCronJob(jobId);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const remove = async (jobId: string) => {
    if (!confirm(`¿Eliminar job "${jobId}"?`)) return;
    try {
      await api.deleteCronJob(jobId);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const save = async () => {
    if (!editing) return;
    try {
      if (editing._isNew) {
        const { _isNew, ...job } = editing;
        await api.createCronJob(job);
      } else {
        await api.updateCronJob(editing);
      }
      setEditing(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updatePayload = (field: string, value: string) => {
    setEditing({ ...editing, payload: { ...editing.payload, [field]: value } });
  };

  const updateDelivery = (field: string, value: string) => {
    setEditing({
      ...editing,
      payload: {
        ...editing.payload,
        delivery: { ...editing.payload?.delivery, [field]: value },
      },
    });
  };

  if (!connected) return <div className="p-6 text-gray-400">Esperando conexión SSH...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">⏰ Cron Jobs</h1>
        <button onClick={() => setEditing({
          _isNew: true, name: '', enabled: true,
          schedule: { kind: 'cron', expr: '0 9 * * *' },
          payload: { kind: 'agentTurn', agentId: '', message: '', delivery: { kind: 'whatsapp', to: '' } }
        })}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm">
          + Nuevo Job
        </button>
      </div>

      {error && <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <div key={job.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-medium">{job.name || job.id}</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {job.schedule?.kind}: {job.schedule?.expr || job.schedule?.everyMs || job.schedule?.atMs}
                  </p>
                  {job.payload?.agentId && (
                    <p className="text-gray-500 text-xs mt-1">Agente: <span className="text-gray-400">{job.payload.agentId}</span></p>
                  )}
                  {job.payload?.delivery && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      Delivery: <span className="text-gray-400">{job.payload.delivery.kind}</span>
                      {job.payload.delivery.to && <> → <span className="text-gray-400">{job.payload.delivery.to}</span></>}
                    </p>
                  )}
                  {job.payload?.message && (
                    <p className="text-gray-500 text-xs mt-1.5 max-w-xl truncate italic">"{job.payload.message}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded ${job.enabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                    {job.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={() => run(job.id)} className="text-xs text-orange-400 hover:text-orange-300">Ejecutar</button>
                <button onClick={() => toggle(job.id)} className="text-xs text-blue-400 hover:text-blue-300">
                  {job.enabled ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => setEditing({ ...job })} className="text-xs text-blue-400 hover:text-blue-300">Editar</button>
                <button onClick={() => remove(job.id)} className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-gray-500">No hay cron jobs configurados</p>}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-white mb-4">{editing._isNew ? 'Nuevo Job' : 'Editar Job'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Nombre</label>
                <input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Schedule Kind</label>
                  <select value={editing.schedule?.kind || 'cron'} onChange={e => setEditing({ ...editing, schedule: { ...editing.schedule, kind: e.target.value } })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                    <option value="cron">Cron</option>
                    <option value="interval">Interval</option>
                    <option value="at">At</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Expresión</label>
                  <input value={editing.schedule?.expr || ''} onChange={e => setEditing({ ...editing, schedule: { ...editing.schedule, expr: e.target.value } })}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" placeholder="0 9 * * *" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Agent ID</label>
                <input value={editing.payload?.agentId || ''} onChange={e => updatePayload('agentId', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" placeholder="main" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Delivery Kind</label>
                  <select value={editing.payload?.delivery?.kind || 'whatsapp'} onChange={e => updateDelivery('kind', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Destinatario</label>
                  <input value={editing.payload?.delivery?.to || ''} onChange={e => updateDelivery('to', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm" placeholder="5491112345678@s.whatsapp.net" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Prompt (message)</label>
                <textarea value={editing.payload?.message || ''} onChange={e => updatePayload('message', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm h-24" placeholder="El prompt que ejecutará el agente..." />
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

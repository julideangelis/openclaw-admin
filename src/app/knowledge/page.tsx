'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/components/ssh-provider';

const WORKSPACE_FILES = ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'HEARTBEAT.md', 'BOOTSTRAP.md', 'IDENTITY.md', 'USER.md', 'MEMORY.md', 'SHIELD.md'];

export default function KnowledgePage() {
  const { api, connected } = useAdmin();
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadFiles = async () => {
    try {
      const data = await api.listWorkspaceFiles();
      setFiles(data.files || WORKSPACE_FILES.map(f => ({ name: f, path: f })));
    } catch {
      setFiles(WORKSPACE_FILES.map(f => ({ name: f, path: f })));
    }
  };

  const loadSkills = async () => {
    try {
      const data = await api.listSkills();
      setSkills(data.skills || []);
    } catch {}
  };

  useEffect(() => {
    if (connected) {
      loadFiles();
      loadSkills();
    }
  }, [connected]);

  const openFile = async (name: string) => {
    try {
      setLoading(true);
      setError('');
      setSelectedFile(name);
      const data = await api.readWorkspaceFile(name);
      setContent(data.content || '');
    } catch (e: any) {
      setContent('');
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    try {
      setSaving(true);
      setError('');
      await api.writeWorkspaceFile(selectedFile, content);
      setSuccess(`${selectedFile} guardado`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!connected) return <div className="p-6 text-gray-400">Esperando conexión SSH...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>

      {error && <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-900/50 border border-green-700 rounded text-green-300 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File list */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase">Workspace Files</h2>
          {(files.length > 0 ? files : WORKSPACE_FILES.map(f => ({ name: f, path: f }))).map((f) => (
            <button key={f.name} onClick={() => openFile(f.name)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedFile === f.name ? 'bg-orange-600/20 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              {f.name}
            </button>
          ))}

          {skills.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-400 uppercase mt-6">Skills</h2>
              {skills.map((s: any) => (
                <div key={s.name} className="px-3 py-2 text-sm text-gray-400">
                  {s.name} <span className="text-xs text-gray-600">({s.source})</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-medium">{selectedFile}</h2>
                <button onClick={saveFile} disabled={saving}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
              {loading ? (
                <div className="text-gray-400">Cargando...</div>
              ) : (
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  className="w-full h-[65vh] bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-300 font-mono text-sm resize-none" />
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-20">Seleccioná un archivo para editar</div>
          )}
        </div>
      </div>
    </div>
  );
}

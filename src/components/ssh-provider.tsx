'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { OpenClawAPI } from '@/lib/openclaw-api';

interface AdminContextType {
  api: OpenClawAPI;
  connected: boolean;
  status: any;
  error: string | null;
  refreshStatus: () => Promise<void>;
  config: any;
  configRaw: string;
  configLoading: boolean;
  configError: string | null;
  configLastLoadedAt: number | null;
  loadConfigOnce: () => Promise<void>;
  reloadConfig: () => Promise<void>;
  updateConfigLocal: (nextConfig: any, nextRaw?: string) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within SSHProvider');
  return ctx;
}

export function SSHProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [configRaw, setConfigRaw] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLastLoadedAt, setConfigLastLoadedAt] = useState<number | null>(null);
  const apiRef = useRef(new OpenClawAPI());
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const configLoadedRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await apiRef.current.getStatus();
      setStatus(data.status);
      setConnected(true);
      setError(null);
    } catch (err: any) {
      setConnected(false);
      setError(err.message || 'Error de conexión SSH');
    }
  }, []);

  const loadConfig = useCallback(
    async (force = false) => {
      if (!connected) return;
      if (!force && configLoadedRef.current) return;
      if (configLoading) return;

      try {
        setConfigLoading(true);
        const data = await apiRef.current.getConfig();
        setConfig(data.config ?? null);
        setConfigRaw(data.raw || (data.config ? JSON.stringify(data.config, null, 2) : ''));
        setConfigError(null);
        setConfigLastLoadedAt(Date.now());
        configLoadedRef.current = true;
      } catch (err: any) {
        setConfigError(err.message || 'Error al cargar configuración');
      } finally {
        setConfigLoading(false);
      }
    },
    [connected, configLoading]
  );

  const loadConfigOnce = useCallback(async () => {
    await loadConfig(false);
  }, [loadConfig]);

  const reloadConfig = useCallback(async () => {
    await loadConfig(true);
  }, [loadConfig]);

  const updateConfigLocal = useCallback((nextConfig: any, nextRaw?: string) => {
    setConfig(nextConfig ?? null);
    setConfigRaw(typeof nextRaw === 'string' ? nextRaw : nextConfig ? JSON.stringify(nextConfig, null, 2) : '');
    setConfigError(null);
    setConfigLastLoadedAt(Date.now());
    configLoadedRef.current = true;
  }, []);

  // Check connection on mount and poll
  useEffect(() => {
    refreshStatus();
    pollRef.current = setInterval(refreshStatus, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (connected) {
      void loadConfigOnce();
      return;
    }

    configLoadedRef.current = false;
    setConfig(null);
    setConfigRaw('');
    setConfigError(null);
    setConfigLoading(false);
    setConfigLastLoadedAt(null);
  }, [connected, loadConfigOnce]);

  return (
    <AdminContext.Provider
      value={{
        api: apiRef.current,
        connected,
        status,
        error,
        refreshStatus,
        config,
        configRaw,
        configLoading,
        configError,
        configLastLoadedAt,
        loadConfigOnce,
        reloadConfig,
        updateConfigLocal,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

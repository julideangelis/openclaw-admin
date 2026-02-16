'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { OpenClawAPI } from '@/lib/openclaw-api';

interface AdminContextType {
  api: OpenClawAPI;
  connected: boolean;
  status: any;
  error: string | null;
  refreshStatus: () => Promise<void>;
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
  const apiRef = useRef(new OpenClawAPI());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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

  // Check connection on mount and poll
  useEffect(() => {
    refreshStatus();
    pollRef.current = setInterval(refreshStatus, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshStatus]);

  return (
    <AdminContext.Provider
      value={{
        api: apiRef.current,
        connected,
        status,
        error,
        refreshStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

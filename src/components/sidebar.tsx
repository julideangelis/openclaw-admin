'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/components/ssh-provider';

const NAV = [
  { href: '/', label: 'Panel', icon: '🦞' },
  { href: '/agents', label: 'Agentes', icon: '🤖' },
  { href: '/permissions', label: 'Permisos', icon: '🔐' },
  { href: '/cron', label: 'Cron Jobs', icon: '⏰' },
  { href: '/config', label: 'Configuración', icon: '⚙️' },
  { href: '/knowledge', label: 'Knowledge', icon: '📚' },
  { href: '/monitoring', label: 'Monitoreo', icon: '📊' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected, error } = useAdmin();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-orange-500">🦞 OpenClaw Admin</h1>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-400">
            {connected ? 'SSH Conectado' : error ? 'Error SSH' : 'Desconectado'}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                active
                  ? 'bg-orange-500/20 text-orange-400 font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

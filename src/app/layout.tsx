import type { Metadata } from 'next';
import { Providers } from './providers';
import { Sidebar } from '@/components/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenClaw Admin',
  description: 'Panel de administración remoto para OpenClaw',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-gray-100">
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

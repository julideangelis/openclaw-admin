'use client';

import { SSHProvider } from '@/components/ssh-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SSHProvider>{children}</SSHProvider>;
}

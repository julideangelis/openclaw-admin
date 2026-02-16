import { NextResponse } from 'next/server';
import { sshExec, isSSHConfigured } from '@/lib/ssh-client';

export async function POST() {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const result = await sshExec('openclaw gateway restart 2>&1', 30000);
    return NextResponse.json({ ok: true, output: result.stdout });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { sshExec, isSSHConfigured } from '@/lib/ssh-client';

export async function POST() {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const result = await sshExec('openclaw doctor 2>&1', 60000);
    return NextResponse.json({ output: result.stdout, exitCode: result.code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

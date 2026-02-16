import { NextResponse } from 'next/server';
import { sshExec, isSSHConfigured } from '@/lib/ssh-client';

export async function GET() {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    // Get gateway status
    const statusResult = await sshExec('openclaw gateway status --json 2>/dev/null || openclaw gateway status 2>&1');
    
    // Get channels status  
    const channelsResult = await sshExec('openclaw channels status --json 2>/dev/null || openclaw channels list 2>&1');

    // Try to parse JSON, fallback to raw text
    let status: any = {};
    try {
      status = JSON.parse(statusResult.stdout);
    } catch {
      status = { raw: statusResult.stdout, connected: statusResult.code === 0 };
    }

    let channels: any[] = [];
    try {
      channels = JSON.parse(channelsResult.stdout);
    } catch {
      channels = [{ raw: channelsResult.stdout }];
    }

    return NextResponse.json({ status, channels, connected: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, connected: false }, { status: 500 });
  }
}

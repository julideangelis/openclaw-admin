import { NextRequest, NextResponse } from 'next/server';
import { sshExec, isSSHConfigured } from '@/lib/ssh-client';

export async function GET(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  const tail = req.nextUrl.searchParams.get('tail') || '100';

  try {
    const result = await sshExec(`openclaw logs --tail ${tail} 2>&1`);
    
    // Try to parse as JSON lines
    const lines = result.stdout.split('\n').filter(Boolean);
    const logs = lines.map((line, i) => {
      try {
        return JSON.parse(line);
      } catch {
        // Parse log format: [TIMESTAMP] [LEVEL] message
        const match = line.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)/);
        if (match) {
          return { timestamp: match[1], level: match[2].toLowerCase(), message: match[3] };
        }
        return { timestamp: new Date().toISOString(), level: 'info', message: line, index: i };
      }
    });

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sshReadFile, sshWriteFile, sshExec, isSSHConfigured } from '@/lib/ssh-client';

const CONFIG_PATH = '~/.openclaw/openclaw.json';

export async function GET() {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const content = await sshReadFile(CONFIG_PATH);
    // openclaw.json is JSON5, try to parse
    let config: any;
    try {
      config = JSON.parse(content);
    } catch {
      // Return raw if not parseable (JSON5 with comments)
      return NextResponse.json({ config: null, raw: content });
    }
    return NextResponse.json({ config, raw: content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const content = typeof body.raw === 'string' ? body.raw : JSON.stringify(body.config, null, 2);
    
    // Backup current config
    await sshExec(`cp ${CONFIG_PATH} ${CONFIG_PATH}.backup 2>/dev/null || true`);
    
    // Write new config
    await sshWriteFile(CONFIG_PATH, content);

    // Restart gateway to apply changes
    if (body.restart !== false) {
      await sshExec('openclaw gateway restart 2>&1');
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

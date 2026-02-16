import { NextRequest, NextResponse } from 'next/server';
import { sshReadFile, sshWriteFile, sshExec, isSSHConfigured } from '@/lib/ssh-client';

const CONFIG_PATH = '~/.openclaw/openclaw.json';

export async function GET() {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const content = await sshReadFile(CONFIG_PATH);
    const config = JSON.parse(content);
    const agents = config?.agents?.list || [];
    const defaults = config?.agents?.defaults || {};
    return NextResponse.json({ agents, defaults });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const { agent } = await req.json();
    const content = await sshReadFile(CONFIG_PATH);
    const config = JSON.parse(content);

    if (!config.agents) config.agents = { list: [] };
    if (!config.agents.list) config.agents.list = [];

    const idx = config.agents.list.findIndex((a: any) => a.id === agent.id);
    if (idx >= 0) {
      config.agents.list[idx] = agent;
    } else {
      config.agents.list.push(agent);
    }

    await sshWriteFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    await sshExec('openclaw gateway restart 2>&1');

    return NextResponse.json({ ok: true, agent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const { id } = await req.json();
    const content = await sshReadFile(CONFIG_PATH);
    const config = JSON.parse(content);

    if (config.agents?.list) {
      config.agents.list = config.agents.list.filter((a: any) => a.id !== id);
    }

    await sshWriteFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    await sshExec('openclaw gateway restart 2>&1');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

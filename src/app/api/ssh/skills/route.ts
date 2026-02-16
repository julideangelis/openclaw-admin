import { NextResponse } from 'next/server';
import { sshExec, isSSHConfigured } from '@/lib/ssh-client';

export async function GET() {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    // List skills from both locations
    const globalSkills = await sshExec('ls -d ~/.openclaw/skills/*/ 2>/dev/null || true');
    const workspaceSkills = await sshExec('ls -d ~/.openclaw/workspace/skills/*/ 2>/dev/null || true');

    const parseSkills = (output: string, source: string) =>
      output.split('\n').filter(Boolean).map((dir) => ({
        name: dir.trim().replace(/\/$/, '').split('/').pop() || '',
        path: dir.trim(),
        source,
      }));

    const skills = [
      ...parseSkills(globalSkills.stdout, 'global'),
      ...parseSkills(workspaceSkills.stdout, 'workspace'),
    ];

    return NextResponse.json({ skills });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

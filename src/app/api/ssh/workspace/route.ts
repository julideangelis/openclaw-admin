import { NextRequest, NextResponse } from 'next/server';
import { sshExec, sshReadFile, sshWriteFile, isSSHConfigured } from '@/lib/ssh-client';

const WORKSPACE_PATH = '~/.openclaw/workspace';

export async function GET(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  const file = req.nextUrl.searchParams.get('file');

  try {
    if (file) {
      // Read specific file
      const content = await sshReadFile(`${WORKSPACE_PATH}/${file}`);
      const statResult = await sshExec(`stat -c '%s %Y' "${WORKSPACE_PATH}/${file}" 2>/dev/null || echo "0 0"`);
      const [size, mtime] = statResult.stdout.split(' ');
      return NextResponse.json({
        name: file,
        path: `${WORKSPACE_PATH}/${file}`,
        content,
        size: parseInt(size || '0'),
        lastModified: parseInt(mtime || '0') * 1000,
      });
    }

    // List all workspace files
    const result = await sshExec(`ls -la ${WORKSPACE_PATH}/*.md 2>/dev/null; ls -la ${WORKSPACE_PATH}/*.txt 2>/dev/null || true`);
    const files = result.stdout
      .split('\n')
      .filter((line) => line.includes('.md') || line.includes('.txt'))
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        const name = parts[parts.length - 1]?.split('/').pop() || '';
        return { name, path: `${WORKSPACE_PATH}/${name}` };
      })
      .filter((f) => f.name);

    return NextResponse.json({ files });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const { file, content } = await req.json();
    if (!file || content === undefined) {
      return NextResponse.json({ error: 'file and content required' }, { status: 400 });
    }

    await sshWriteFile(`${WORKSPACE_PATH}/${file}`, content);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

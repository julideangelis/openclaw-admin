import { NextRequest, NextResponse } from 'next/server';
import { sshExec, sshReadFile, sshWriteFile, isSSHConfigured } from '@/lib/ssh-client';

const DEFAULT_WORKSPACE_PATH = '~/.openclaw/workspace';
const SAFE_WORKSPACE_PATH = /^[A-Za-z0-9_./~:-]+$/;
const SAFE_FILE_NAME = /^[A-Za-z0-9._-]+$/;

function resolveWorkspacePath(rawWorkspace?: string | null) {
  const candidate = (rawWorkspace || DEFAULT_WORKSPACE_PATH).trim();
  if (!candidate) return DEFAULT_WORKSPACE_PATH;
  if (!SAFE_WORKSPACE_PATH.test(candidate)) {
    throw new Error('Invalid workspace path');
  }
  return candidate;
}

function resolveFileName(rawFile: string) {
  const file = rawFile.trim();
  if (!file) throw new Error('Invalid file');
  if (file.includes('/') || file.includes('\\') || file.includes('..')) {
    throw new Error('Invalid file');
  }
  if (!SAFE_FILE_NAME.test(file)) {
    throw new Error('Invalid file');
  }
  return file;
}

function buildWorkspaceFilePath(workspacePath: string, file: string) {
  return `${workspacePath.replace(/\/+$/, '')}/${file}`;
}

export async function GET(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  const file = req.nextUrl.searchParams.get('file');

  try {
    const workspacePath = resolveWorkspacePath(req.nextUrl.searchParams.get('workspace'));

    if (file) {
      // Read specific file
      const safeFile = resolveFileName(file);
      const filePath = buildWorkspaceFilePath(workspacePath, safeFile);
      const content = await sshReadFile(filePath);
      const statResult = await sshExec(`stat -c '%s %Y' "${filePath}" 2>/dev/null || echo "0 0"`);
      const [size, mtime] = statResult.stdout.split(' ');
      return NextResponse.json({
        name: safeFile,
        path: filePath,
        content,
        size: parseInt(size || '0'),
        lastModified: parseInt(mtime || '0') * 1000,
      });
    }

    // List all workspace files
    const result = await sshExec(`ls -la ${workspacePath}/*.md 2>/dev/null; ls -la ${workspacePath}/*.txt 2>/dev/null || true`);
    const files = result.stdout
      .split('\n')
      .filter((line) => line.includes('.md') || line.includes('.txt'))
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        const name = parts[parts.length - 1]?.split('/').pop() || '';
        return { name, path: buildWorkspaceFilePath(workspacePath, name) };
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
    const { file, content, workspace } = await req.json();
    if (!file || content === undefined) {
      return NextResponse.json({ error: 'file and content required' }, { status: 400 });
    }

    const workspacePath = resolveWorkspacePath(workspace);
    const safeFile = resolveFileName(file);
    await sshWriteFile(buildWorkspaceFilePath(workspacePath, safeFile), content);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

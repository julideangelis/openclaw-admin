import { NextRequest, NextResponse } from 'next/server';
import { sshReadFile, sshWriteFile, sshExec, isSSHConfigured } from '@/lib/ssh-client';

const CRON_PATH = '~/.openclaw/cron/jobs.json';

// Read and parse the cron file, preserving the wrapper structure
async function readCronFile(): Promise<{ wrapper: any; jobs: any[] }> {
  const content = await sshReadFile(CRON_PATH);
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    return { wrapper: null, jobs: parsed };
  }
  if (parsed && Array.isArray(parsed.jobs)) {
    return { wrapper: parsed, jobs: parsed.jobs };
  }
  return { wrapper: parsed || null, jobs: [] };
}

// Write jobs back preserving the original format ({ version, jobs } or plain array)
async function writeCronFile(wrapper: any, jobs: any[]): Promise<void> {
  let data: any;
  if (wrapper && typeof wrapper === 'object' && !Array.isArray(wrapper)) {
    data = { ...wrapper, jobs };
  } else {
    data = jobs;
  }
  await sshWriteFile(CRON_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const { jobs } = await readCronFile();
    return NextResponse.json({ jobs });
  } catch (err: any) {
    // File might not exist
    if (err.message?.includes('No such file')) {
      return NextResponse.json({ jobs: [] });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSSHConfigured()) {
    return NextResponse.json({ error: 'SSH not configured' }, { status: 400 });
  }

  try {
    const { action, jobId, job } = await req.json();

    if (action === 'run' && jobId) {
      const result = await sshExec(`openclaw cron run --id="${jobId}" 2>&1`);
      return NextResponse.json({ ok: true, output: result.stdout });
    }

    if (action === 'toggle' && jobId) {
      const { wrapper, jobs } = await readCronFile();
      const idx = jobs.findIndex((j: any) => j.id === jobId);
      if (idx >= 0) {
        jobs[idx].enabled = !jobs[idx].enabled;
        await writeCronFile(wrapper, jobs);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete' && jobId) {
      const { wrapper, jobs } = await readCronFile();
      const filtered = jobs.filter((j: any) => j.id !== jobId);
      await writeCronFile(wrapper, filtered);
      return NextResponse.json({ ok: true });
    }

    if (action === 'create' && job) {
      // Try CLI first
      const result = await sshExec(`openclaw cron add --json '${JSON.stringify(job)}' 2>&1`);
      if (result.code !== 0) {
        // Fallback: add to jobs.json directly
        let wrapper: any = null;
        let jobs: any[] = [];
        try {
          const data = await readCronFile();
          wrapper = data.wrapper;
          jobs = data.jobs;
        } catch {}
        if (!job.id) job.id = `job_${Date.now()}`;
        jobs.push(job);
        await writeCronFile(wrapper, jobs);
      }
      return NextResponse.json({ ok: true, job });
    }

    if (action === 'update' && job) {
      const { wrapper, jobs } = await readCronFile();
      const idx = jobs.findIndex((j: any) => j.id === job.id);
      if (idx >= 0) {
        jobs[idx] = { ...jobs[idx], ...job };
        await writeCronFile(wrapper, jobs);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

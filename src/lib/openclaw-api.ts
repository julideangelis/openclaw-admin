'use client';

// OpenClaw API - Fetch-based client that calls Next.js API routes
// These routes connect to the Hetzner VPS via SSH

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/ssh${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || `API error: ${res.status}`);
  }
  return data as T;
}

export class OpenClawAPI {
  // --- Status ---
  async getStatus() {
    return apiFetch<{ status: any; channels: any[]; connected: boolean }>('/status');
  }

  // --- Config ---
  async getConfig() {
    return apiFetch<{ config: any; raw: string }>('/config');
  }

  async setConfig(config: any, restart = true) {
    return apiFetch('/config', {
      method: 'POST',
      body: JSON.stringify({ config, restart }),
    });
  }

  async setConfigRaw(raw: string, restart = true) {
    return apiFetch('/config', {
      method: 'POST',
      body: JSON.stringify({ raw, restart }),
    });
  }

  // --- Agents ---
  async listAgents() {
    return apiFetch<{ agents: any[]; defaults: any }>('/agents');
  }

  async updateAgent(agent: any) {
    return apiFetch('/agents', {
      method: 'POST',
      body: JSON.stringify({ agent }),
    });
  }

  async deleteAgent(id: string) {
    return apiFetch('/agents', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  // --- Cron ---
  async listCronJobs() {
    return apiFetch<{ jobs: any[] }>('/cron');
  }

  async createCronJob(job: any) {
    return apiFetch('/cron', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', job }),
    });
  }

  async updateCronJob(job: any) {
    return apiFetch('/cron', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', job }),
    });
  }

  async deleteCronJob(jobId: string) {
    return apiFetch('/cron', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', jobId }),
    });
  }

  async runCronJob(jobId: string) {
    return apiFetch('/cron', {
      method: 'POST',
      body: JSON.stringify({ action: 'run', jobId }),
    });
  }

  async toggleCronJob(jobId: string) {
    return apiFetch('/cron', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle', jobId }),
    });
  }

  // --- Workspace ---
  async listWorkspaceFiles() {
    return apiFetch<{ files: { name: string; path: string }[] }>('/workspace');
  }

  async readWorkspaceFile(file: string) {
    return apiFetch<{ name: string; content: string; size: number; lastModified: number }>(
      `/workspace?file=${encodeURIComponent(file)}`
    );
  }

  async writeWorkspaceFile(file: string, content: string) {
    return apiFetch('/workspace', {
      method: 'POST',
      body: JSON.stringify({ file, content }),
    });
  }

  // --- Skills ---
  async listSkills() {
    return apiFetch<{ skills: { name: string; path: string; source: string }[] }>('/skills');
  }

  // --- Logs ---
  async getLogs(tail = 100) {
    return apiFetch<{ logs: any[] }>(`/logs?tail=${tail}`);
  }

  // --- Doctor ---
  async runDoctor() {
    return apiFetch<{ output: string; exitCode: number }>('/doctor', { method: 'POST' });
  }

  // --- Gateway ---
  async restartGateway() {
    return apiFetch<{ ok: boolean; output: string }>('/gateway/restart', { method: 'POST' });
  }
}

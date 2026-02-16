// SSH Connection Manager - Server-side only
// Uses ssh2 to execute commands on remote Hetzner VPS

import { Client, ConnectConfig } from 'ssh2';
import { readFileSync } from 'fs';

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath?: string;
  password?: string;
}

function getConfig(): SSHConfig {
  const host = process.env.SSH_HOST;
  if (!host) throw new Error('SSH_HOST not configured in .env.local');

  return {
    host,
    port: parseInt(process.env.SSH_PORT || '22', 10),
    username: process.env.SSH_USER || 'root',
    privateKeyPath: process.env.SSH_KEY_PATH,
    password: process.env.SSH_PASSWORD,
  };
}

function buildConnectConfig(cfg: SSHConfig): ConnectConfig {
  const connectCfg: ConnectConfig = {
    host: cfg.host,
    port: cfg.port,
    username: cfg.username,
    readyTimeout: 10000,
  };

  if (cfg.privateKeyPath) {
    try {
      connectCfg.privateKey = readFileSync(cfg.privateKeyPath.replace('~', process.env.HOME || ''));
    } catch {
      console.warn(`[SSH] Could not read key at ${cfg.privateKeyPath}, falling back to password`);
    }
  }

  if (cfg.password) {
    connectCfg.password = cfg.password;
  }

  return connectCfg;
}

// Execute a command via SSH, returns { stdout, stderr, code }
export async function sshExec(command: string, timeout = 30000): Promise<{ stdout: string; stderr: string; code: number }> {
  const cfg = getConfig();
  const connectCfg = buildConnectConfig(cfg);

  return new Promise((resolve, reject) => {
    const conn = new Client();
    const timer = setTimeout(() => {
      conn.end();
      reject(new Error(`SSH command timeout after ${timeout}ms: ${command.substring(0, 80)}`));
    }, timeout);

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          conn.end();
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', (data: Buffer) => { stdout += data.toString(); });
        stream.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

        stream.on('close', (code: number) => {
          clearTimeout(timer);
          conn.end();
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code || 0 });
        });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`SSH connection failed: ${err.message}`));
    });

    conn.connect(connectCfg);
  });
}

// Read a file from the remote server
export async function sshReadFile(filePath: string): Promise<string> {
  // Replace ~ with $HOME so tilde expansion works inside double quotes
  const expandedPath = filePath.replace(/^~/, '$HOME');
  const { stdout, stderr, code } = await sshExec(`cat "${expandedPath}"`);
  if (code !== 0 && stderr) {
    throw new Error(`Failed to read ${filePath}: ${stderr}`);
  }
  return stdout;
}

// Write content to a file on the remote server
export async function sshWriteFile(filePath: string, content: string): Promise<void> {
  // Replace ~ with $HOME so tilde expansion works inside double quotes
  const expandedPath = filePath.replace(/^~/, '$HOME');
  // Use heredoc to safely write content with special characters
  const escaped = content.replace(/\\/g, '\\\\').replace(/'/g, "'\\''");
  const { stderr, code } = await sshExec(`cat > "${expandedPath}" << 'OPENCLAW_EOF'\n${content}\nOPENCLAW_EOF`);
  if (code !== 0 && stderr) {
    throw new Error(`Failed to write ${filePath}: ${stderr}`);
  }
}

// Test SSH connection
export async function sshTest(): Promise<boolean> {
  try {
    const { code } = await sshExec('echo ok', 5000);
    return code === 0;
  } catch {
    return false;
  }
}

// Check if SSH is configured
export function isSSHConfigured(): boolean {
  return !!process.env.SSH_HOST;
}

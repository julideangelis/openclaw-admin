// OpenClaw Admin - Type Definitions

// ===== Gateway =====
export interface GatewayStatus {
  connected: boolean;
  version?: string;
  uptime?: number;
  model?: string;
  channels?: ChannelStatus[];
  agents?: AgentSummary[];
  sessions?: SessionSummary[];
}

export interface ChannelStatus {
  id: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  dmPolicy: 'pairing' | 'open' | 'closed';
  allowFrom?: string[];
  error?: string;
}

// ===== Agents =====
export interface Agent {
  id: string;
  name: string;
  model: string;
  workspace: string;
  tools: AgentTools;
  sandbox: SandboxConfig;
  subagents?: SubagentConfig;
  enabled: boolean;
}

export interface AgentTools {
  allow: string[];
  deny: string[];
}

export interface SubagentConfig {
  allowAgents: string[];
  maxConcurrent: number;
}

export interface SandboxConfig {
  mode: 'off' | 'non-main' | 'all';
  scope: 'session' | 'agent' | 'shared';
}

export interface AgentSummary {
  id: string;
  name: string;
  model: string;
  activeSessions: number;
  tokensUsed: number;
}

// ===== Sessions =====
export interface SessionSummary {
  id: string;
  agentId: string;
  channel: string;
  type: 'main' | 'group' | 'isolated' | 'cron';
  lastMessage?: string;
  lastActivity?: number;
  tokensUsed: number;
  model: string;
  thinkingLevel: string;
}

// ===== Cron Jobs =====
export interface CronJob {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: CronSchedule;
  sessionTarget: 'main' | 'isolated';
  wakeMode: 'now' | 'next-heartbeat';
  payload: CronPayload;
  delivery?: CronDelivery;
  agentId?: string;
  deleteAfterRun?: boolean;
  lastRun?: CronRun;
  nextRun?: number;
}

export interface CronSchedule {
  kind: 'cron' | 'at' | 'interval';
  expr?: string;      // cron expression (5-field)
  tz?: string;         // timezone
  atMs?: number;       // one-shot timestamp
  everyMs?: number;    // interval in ms
}

export interface CronPayload {
  kind: 'systemEvent' | 'agentTurn';
  prompt?: string;
  model?: string;
  thinking?: string;
}

export interface CronDelivery {
  channel: string;
  target?: string;
}

export interface CronRun {
  id: string;
  jobId: string;
  status: 'ok' | 'error' | 'skipped' | 'running';
  startedAt: number;
  finishedAt?: number;
  error?: string;
  tokensUsed?: number;
}

// ===== Configuration =====
export interface OpenClawConfig {
  gateway?: GatewayConfig;
  agents?: AgentsConfig;
  channels?: Record<string, any>;
  cron?: CronConfig;
  plugins?: Record<string, any>;
  [key: string]: any;
}

export interface GatewayConfig {
  bind?: string;
  port?: number;
  auth?: {
    mode: 'none' | 'token' | 'password';
    token?: string;
    allowTailscale?: boolean;
  };
  tailscale?: {
    mode: 'off' | 'serve' | 'funnel';
    resetOnExit?: boolean;
  };
  controlUi?: {
    enabled: boolean;
    basePath?: string;
    allowInsecureAuth?: boolean;
  };
  http?: {
    endpoints?: Record<string, any>;
  };
}

export interface AgentsConfig {
  defaults?: {
    model?: string;
    workspace?: string;
    sandbox?: SandboxConfig;
  };
  list?: Agent[];
}

export interface CronConfig {
  enabled: boolean;
  store?: string;
  maxConcurrentRuns?: number;
}

// ===== Knowledge Base =====
export interface WorkspaceFile {
  name: string;
  path: string;
  content: string;
  lastModified?: number;
  size?: number;
}

export interface Skill {
  name: string;
  path: string;
  description?: string;
  hasSkillMd: boolean;
}

// ===== Logs =====
export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
}

// ===== WebSocket Protocol =====
export interface WSMessage {
  id?: string;
  method: string;
  params?: any;
}

export interface WSResponse {
  id?: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// ===== Available Tools =====
export const OPENCLAW_TOOLS = [
  'exec', 'read', 'write', 'edit', 'apply_patch',
  'browser', 'web_search', 'web_fetch',
  'sessions_list', 'sessions_history', 'sessions_send', 'sessions_spawn',
  'cron', 'memory', 'message', 'process',
  'canvas', 'camera', 'screen', 'location',
  'system.run', 'system.notify',
  'skills.bins',
] as const;

export type OpenClawTool = typeof OPENCLAW_TOOLS[number];

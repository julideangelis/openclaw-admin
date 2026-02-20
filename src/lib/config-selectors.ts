const FALLBACK_WORKSPACE = '~/.openclaw/workspace';

interface AgentLike {
  id?: string;
  name?: string;
  workspace?: string;
}

interface AgentsDefaultsLike {
  model?: string | { primary?: string };
  models?: Record<string, unknown>;
  workspace?: string;
}

interface OpenClawConfigLike {
  agents?: {
    defaults?: AgentsDefaultsLike;
    list?: AgentLike[];
  };
}

export function getAgentsDefaults(config: OpenClawConfigLike | null | undefined) {
  return config?.agents?.defaults ?? {};
}

export function getPrimaryModel(config: OpenClawConfigLike | null | undefined) {
  const model = getAgentsDefaults(config)?.model;
  if (typeof model === 'string' && model.trim()) return model.trim();
  if (model && typeof model === 'object' && typeof model.primary === 'string' && model.primary.trim()) {
    return model.primary.trim();
  }
  return '';
}

export function getAvailableModels(config: OpenClawConfigLike | null | undefined) {
  const models = getAgentsDefaults(config)?.models;
  if (models && typeof models === 'object') {
    return Object.keys(models).filter(Boolean);
  }
  const primary = getPrimaryModel(config);
  return primary ? [primary] : [];
}

export function getDefaultWorkspace(config: OpenClawConfigLike | null | undefined) {
  const workspace = getAgentsDefaults(config)?.workspace;
  if (typeof workspace === 'string' && workspace.trim()) {
    return workspace.trim();
  }
  return FALLBACK_WORKSPACE;
}

export function getAgentWorkspace(agent: AgentLike | null | undefined, fallbackWorkspace: string) {
  const workspace = typeof agent?.workspace === 'string' ? agent.workspace.trim() : '';
  return workspace || fallbackWorkspace;
}

export function getKnowledgeWorkspaceOptions(config: OpenClawConfigLike | null | undefined) {
  const defaultWorkspace = getDefaultWorkspace(config);
  const options: { id: string; label: string; path: string }[] = [
    { id: 'defaults', label: `Default (${defaultWorkspace})`, path: defaultWorkspace },
  ];

  const seen = new Set<string>([defaultWorkspace]);
  const agents = Array.isArray(config?.agents?.list) ? config.agents.list : [];

  for (const agent of agents) {
    const workspace = typeof agent?.workspace === 'string' ? agent.workspace.trim() : '';
    if (!workspace || seen.has(workspace)) continue;

    seen.add(workspace);
    options.push({
      id: `agent-${agent.id || workspace}`,
      label: `Agente ${agent.name || agent.id || 'sin-id'} (${workspace})`,
      path: workspace,
    });
  }

  return options;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toString();
}

export function cronExpressionToHuman(expr: string): string {
  const parts = expr.split(' ');
  if (parts.length !== 5) return expr;
  const [min, hour, dom, mon, dow] = parts;
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (dom === '*' && mon === '*' && dow === '*') {
    if (hour === '*' && min === '*') return 'Cada minuto';
    if (hour === '*') return `Cada hora a los :${min.padStart(2, '0')}`;
    return `Cada día a las ${hour}:${min.padStart(2, '0')}`;
  }
  if (dom === '*' && mon === '*' && dow !== '*') {
    const dayNames = dow.split(',').map(d => days[parseInt(d)] || d).join(', ');
    return `${dayNames} a las ${hour}:${min.padStart(2, '0')}`;
  }
  return expr;
}

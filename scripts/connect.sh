#!/bin/bash
# OpenClaw Admin - SSH Tunnel to Hetzner
# Connects local port 18789 to remote OpenClaw Gateway

set -e

# Configuration - reads from .env.local (same vars as the app)
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
fi

SSH_HOST="${SSH_HOST:-tu-ip-hetzner}"
SSH_USER="${SSH_USER:-root}"
SSH_PORT="${SSH_PORT:-22}"
GATEWAY_PORT="${GATEWAY_PORT:-18789}"
LOCAL_PORT="${LOCAL_PORT:-18789}"
SSH_KEY="${SSH_KEY_PATH:-}"

echo "🦞 OpenClaw Admin - SSH Tunnel"
echo "================================"
echo "Conectando a ${SSH_USER}@${SSH_HOST}:${SSH_PORT}"
echo "Tunnel: localhost:${LOCAL_PORT} -> 127.0.0.1:${GATEWAY_PORT}"
echo ""
echo "Una vez conectado, abre http://localhost:3000 en tu navegador"
echo "Presiona Ctrl+C para desconectar"
echo ""

SSH_OPTS="-N -L ${LOCAL_PORT}:127.0.0.1:${GATEWAY_PORT}"
if [ -n "$SSH_KEY" ]; then
  SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

ssh $SSH_OPTS -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST}

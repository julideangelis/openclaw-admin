#!/bin/bash
# OpenClaw Admin - Setup inicial
set -e

echo "🦞 OpenClaw Admin - Setup"
echo "========================="

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js no encontrado. Instálalo primero."
  exit 1
fi

echo "✅ Node.js $(node --version)"

# Install dependencies
echo ""
echo "📦 Instalando dependencias..."
npm install

# Create .env.local if not exists
if [ ! -f .env.local ]; then
  cat > .env.local << 'EOF'
# OpenClaw Admin - SSH Configuration
# These are used by the Next.js API routes to connect to your Hetzner VPS

SSH_HOST=tu-ip-hetzner
SSH_USER=root
SSH_PORT=22

# Use one of these auth methods:
# SSH_KEY_PATH=~/.ssh/id_rsa
# SSH_PASSWORD=tu-password
EOF
  echo "✅ .env.local creado (edita con tus datos de Hetzner)"
else
  echo "ℹ️  .env.local ya existe"
fi

echo ""
echo "🚀 Setup completo!"
echo ""
echo "Próximos pasos:"
echo "  1. Edita .env.local con tu IP de Hetzner y credenciales"
echo "  2. Ejecuta: bash scripts/connect.sh (en otra terminal)"
echo "  3. Ejecuta: npm run dev"
echo "  4. Abre http://localhost:3000"

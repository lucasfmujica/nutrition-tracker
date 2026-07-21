#!/usr/bin/env bash
# Guard anti-regresión: prohibido console.log en src/ (usar devLog, que solo
# imprime en desarrollo). console.warn / console.error siguen permitidos —
# son el contrato de resiliencia (CLAUDE.md: zero silent failures).
set -euo pipefail
cd "$(dirname "$0")/.."

matches=$(grep -rn 'console\.log(' src \
    --include='*.ts' --include='*.tsx' \
    | grep -v '^src/utils/devLog.ts:' || true)

if [ -n "$matches" ]; then
    echo "❌ console.log prohibido en src/ (usá devLog de src/utils/devLog.ts):"
    echo "$matches"
    exit 1
fi

echo "✓ no-console: sin console.log en src/"

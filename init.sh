#!/usr/bin/env bash
# init.sh — Verificacion e inicializacion del entorno
#
# Este script lo ejecuta el agente al COMENZAR una sesion y antes de
# declarar cualquier tarea como `done`. Si falla, la sesion no debe avanzar.
#
# Salida esperada: codigos de salida claros y bloques marcados con [OK]/[FAIL].
#
# Que hace este script:
# 1) valida herramientas base (node/npm)
# 2) valida archivos minimos del harness
# 3) valida consistencia de feature_list.json y archivos .feature
# 4) si existe package.json, ejecuta la suite de tests en modo run

set -u
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()  { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

EXIT_CODE=0

echo "-- 1. Verificando entorno -----------------------------------------"

# Node disponible
if ! command -v node >/dev/null 2>&1; then
  fail "node no esta instalado"
  exit 1
fi
ok "node -> $(node --version)"

# Version minima Node 16
NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 16 ]; then
  fail "Se requiere Node >= 16 (actual: $(node --version))"
  exit 1
fi
ok "Version de Node compatible"

# npm disponible
if ! command -v npm >/dev/null 2>&1; then
  fail "npm no esta instalado"
  exit 1
fi
ok "npm -> $(npm --version)"

echo ""
echo "-- 2. Verificando archivos base del arnes -------------------------"

for f in AGENTS.md feature_list.json docs/architecture.md docs/conventions.md docs/verification.md docs/workflow.md tools/mutate.mjs CHECKPOINTS.md; do
  if [ ! -f "$f" ]; then
    fail "Falta archivo base: $f"
    EXIT_CODE=1
  else
    ok "Existe $f"
  fi
done

echo ""
echo "-- 3. Validando feature_list.json y escenarios --------------------"

node - <<'JS'
const fs   = require('fs');
const path = require('path');
try {
  const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
  const teamMode = Boolean(data.rules && data.rules.team_mode);
  const maxPerOwner = Number((data.rules && data.rules.max_in_progress_per_owner) || 1);
  const valid = new Set(['pending','spec_ready','in_progress','done','blocked']);
  const inProgress = data.features.filter(f => f.status === 'in_progress');
  if (!teamMode && inProgress.length > 1) {
    console.log(`[FAIL]  Hay ${inProgress.length} features en in_progress (maximo 1)`);
    process.exit(1);
  }
  if (teamMode) {
    const byOwner = new Map();
    for (const f of inProgress) {
      const owner = (f.owner || '').trim();
      if (!owner) {
        continue;
      }
      byOwner.set(owner, (byOwner.get(owner) || 0) + 1);
    }
    for (const [owner, count] of byOwner.entries()) {
      if (count > maxPerOwner) {
        console.log(`[FAIL]  Owner ${owner} tiene ${count} features in_progress (maximo ${maxPerOwner})`);
        process.exit(1);
      }
    }
  }
  const requiresSpec = new Set(['spec_ready','in_progress','done']);
  const errors = [];
  for (const f of data.features) {
    if (!valid.has(f.status)) {
      console.log(`[FAIL]  Estado invalido en feature ${f.id}: ${f.status}`);
      process.exit(1);
    }
    if (f.sdd && requiresSpec.has(f.status)) {
      const featureFile = path.join('features', f.name + '.feature');
      if (!fs.existsSync(featureFile)) {
        errors.push(`feature ${f.id} (${f.name}) en ${f.status} sin ${featureFile}`);
      }
    }
  }
  if (errors.length > 0) {
    errors.forEach(e => console.log('[FAIL]  ' + e));
    process.exit(1);
  }
  console.log(`[OK]    feature_list.json valido (${data.features.length} features)`);
  if (teamMode) {
    console.log(`[OK]    team_mode activo (max_in_progress_per_owner=${maxPerOwner})`);
  }
  console.log('[OK]    Escenarios .feature presentes para features sdd no-pending');
} catch (e) {
  console.log('[FAIL]  feature_list.json invalido: ' + e.message);
  process.exit(1);
}
JS

if [ $? -ne 0 ]; then EXIT_CODE=1; fi

echo ""
echo "-- 4. Ejecutando tests --------------------------------------------"

if [ -f "package.json" ]; then
  echo "[INFO]  Ejecutando: npm test -- --run (corre tests una vez, sin watch)"
  if npm test -- --run 2>&1; then
    ok "Todos los tests pasan"
  else
    fail "Hay tests rotos"
    EXIT_CODE=1
  fi
else
  warn "No existe package.json todavia (proyecto no inicializado)"
fi

echo ""
echo "-- 5. Resumen -----------------------------------------------------"

if [ $EXIT_CODE -eq 0 ]; then
  ok "Entorno listo. Puedes empezar a trabajar."
else
  fail "Entorno NO esta listo. Resuelve los errores antes de avanzar."
fi

exit $EXIT_CODE

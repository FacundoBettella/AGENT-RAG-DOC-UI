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
# 4) ejecuta la suite de tests del perfil activo (profiles/active/test.sh);
#    fallback: npm test si hay package.json sin perfil activo

set -u
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()  { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

# Version del harness que estas consumiendo. En un repo consumidor la estampa
# scaffold.sh en .sdd-harness-version; en el repo fuente del plugin se lee
# directo de plugin.json. (Sin node aun: extraccion por grep.)
read_harness_version() {
  if [ -f ".sdd-harness-version" ]; then
    head -n1 .sdd-harness-version | tr -d '[:space:]'
    return
  fi
  local pj="plugins/sdd-harness/.claude-plugin/plugin.json"
  if [ -f "$pj" ]; then
    grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$pj" 2>/dev/null \
      | head -n1 | grep -o '"[^"]*"$' | tr -d '"'
    return
  fi
  echo "desconocida"
}
HARNESS_VERSION=$(read_harness_version)
[ -z "$HARNESS_VERSION" ] && HARNESS_VERSION="desconocida"

printf "${GREEN}"
cat << 'BANNER'
 ___  ___  ___     _  _
/ __||   \|   \   | || |__ _ _ _ _ _  ___ ___ ___
\__ \| |) | |) |  | __ / _` | '_| ' \/ -_|_-<(_-<
|___/|___/|___/   |_||_\__,_|_| |_||_\___/__//__/
BANNER
printf "${GREEN}EY FSO SDD Harness${NC}\n"
printf "${NC}"
printf "${GREEN}                                       v%s${NC}\n" "$HARNESS_VERSION"
echo ""

EXIT_CODE=0

echo "-- 1. Verificando entorno -----------------------------------------"

# Deteccion interna de Node: el propio init.sh usa node para parsear JSON
# (feature_list.json, harness.json). Esto es independiente de los
# prerequisitos de entorno que declara el perfil activo (ver seccion 3c).
NODE_AVAILABLE=false
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
  if [ "$NODE_MAJOR" -ge 16 ]; then
    NODE_AVAILABLE=true
  fi
fi
ok "Entorno base verificado"

echo ""
echo "-- 2. Verificando archivos base del arnes -------------------------"

for f in AGENTS.md feature_list.json docs/architecture.md docs/conventions.md docs/verification.md docs/workflow.md CHECKPOINTS.md; do
  if [ ! -f "$f" ]; then
    fail "Falta archivo base: $f"
    EXIT_CODE=1
  else
    ok "Existe $f"
  fi
done

# settings.json del proyecto
if [ ! -f ".claude/settings.json" ]; then
  fail "Falta .claude/settings.json — corre /sdd-init (o /sdd-update) desde Claude Code"
  EXIT_CODE=1
else
  ok "Existe .claude/settings.json"
fi

# Plugin instalado (verificacion informativa)
if command -v claude >/dev/null 2>&1; then
  if claude plugins list 2>/dev/null | grep -q "sdd-harness"; then
    ok "Plugin sdd-harness instalado"
  else
    warn "Plugin sdd-harness no detectado — ejecuta en Claude Code: /plugin install sdd-harness"
  fi
else
  warn "CLI claude no disponible — verificacion de plugin omitida"
fi

# Directorio de features (puede estar vacio pero debe existir)
if [ ! -d "features" ]; then
  warn "No existe directorio features/ todavia"
else
  ok "Existe features/"
fi

echo ""
echo "-- 3. Validando feature_list.json y escenarios --------------------"

if ! $NODE_AVAILABLE; then
  warn "Validacion de feature_list.json omitida (Node no disponible)"
else
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
fi

echo ""
echo "-- 3b. Activando perfil de stack ----------------------------------"

HARNESS_JSON="harness.json"
PROFILE_NAME=""

if [ ! -f "$HARNESS_JSON" ] && [ -d "profiles" ]; then
  AVAILABLE=$(ls -1 profiles/ 2>/dev/null | grep -v '^active$' || true)
  if [ -n "$AVAILABLE" ]; then
    echo "Primer arranque: harness.json no encontrado."
    echo "Perfiles disponibles:"
    echo "$AVAILABLE" | while IFS= read -r p; do echo "  - $p"; done
    CHOSEN_PROFILE=""
    if [ -t 0 ]; then
      printf "Elegí un perfil: "
      read -r CHOSEN_PROFILE
    fi
    if [ -n "$CHOSEN_PROFILE" ] && [ -d "profiles/$CHOSEN_PROFILE" ]; then
      printf '{"profile": "%s"}\n' "$CHOSEN_PROFILE" > "$HARNESS_JSON"
      PROFILE_NAME="$CHOSEN_PROFILE"
      ok "harness.json creado con perfil '$PROFILE_NAME'"
    else
      warn "Perfil no reconocido — continuando sin perfil"
    fi
  else
    ok "Sin perfiles disponibles — flujo base"
  fi
fi

if [ -f "$HARNESS_JSON" ] && [ -z "$PROFILE_NAME" ]; then
  if $NODE_AVAILABLE; then
    PROFILE_NAME=$(node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync('harness.json','utf8'));
        const p = d.profile;
        if (p && typeof p === 'string' && p.trim() !== '') {
          process.stdout.write(p.trim());
        }
      } catch(e) {}
    " 2>/dev/null || true)
  else
    PROFILE_NAME=$(grep -o '"profile"[[:space:]]*:[[:space:]]*"[^"]*"' "$HARNESS_JSON" 2>/dev/null \
      | grep -o '"[^"]*"$' | tr -d '"' || true)
  fi
fi

if [ -n "$PROFILE_NAME" ]; then
  PROFILE_DIR="profiles/$PROFILE_NAME"
  if [ ! -d "$PROFILE_DIR" ]; then
    fail "perfil '$PROFILE_NAME' no encontrado en profiles/"
    EXIT_CODE=1
  else
    rm -rf profiles/active
    cp -r "$PROFILE_DIR" profiles/active
    ok "Perfil '$PROFILE_NAME' activado en profiles/active/"
  fi
else
  ok "Sin perfil declarado — flujo base"
fi

echo ""
echo "-- 3c. Verificando prerequisitos del perfil activo ----------------"

PREREQ_FILE="profiles/active/prerequisites.json"
if [ ! -d "profiles/active" ] || [ ! -f "$PREREQ_FILE" ]; then
  ok "Sin prerequisitos de stack declarados — flujo base"
else
  REQUIRED_CMDS=""
  if $NODE_AVAILABLE; then
    REQUIRED_CMDS=$(node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync('$PREREQ_FILE','utf8'));
        if (Array.isArray(d.require)) {
          process.stdout.write(d.require.filter(c => typeof c === 'string').join('\n'));
        } else {
          process.exit(2);
        }
      } catch(e) { process.exit(2); }
    " 2>/dev/null)
    PARSE_STATUS=$?
  else
    REQUIRED_CMDS=$(grep -o '"require"[[:space:]]*:[[:space:]]*\[[^]]*\]' "$PREREQ_FILE" 2>/dev/null \
      | grep -o '"[^"]*"' | sed -n '2,$p' | tr -d '"')
    PARSE_STATUS=0
  fi

  if [ "$PARSE_STATUS" -ne 0 ]; then
    warn "profiles/active/prerequisites.json malformado — ignorado, sin verificar prereqs de stack"
  elif [ -z "$REQUIRED_CMDS" ]; then
    ok "El perfil activo no declara prerequisitos de stack"
  else
    while IFS= read -r cmd; do
      [ -z "$cmd" ] && continue
      # Ademas del PATH, mira los binarios locales del proyecto
      # (node_modules/.bin) — las devDependencies del stack viven ahi.
      if command -v "$cmd" >/dev/null 2>&1 || [ -x "node_modules/.bin/$cmd" ]; then
        ok "$cmd -> presente"
      else
        warn "$cmd declarado por el perfil pero no disponible en el entorno"
      fi
    done <<< "$REQUIRED_CMDS"
  fi
fi

echo ""
echo "-- 4. Ejecutando tests --------------------------------------------"

if [ -f "profiles/active/test.sh" ]; then
  echo "[INFO]  Ejecutando: profiles/active/test.sh (runner de tests del perfil activo)"
  if bash profiles/active/test.sh 2>&1; then
    ok "Todos los tests pasan"
  else
    fail "Hay tests rotos"
    EXIT_CODE=1
  fi
elif [ -f "package.json" ]; then
  echo "[INFO]  Ejecutando: npm test -- --run (corre tests una vez, sin watch)"
  if npm test -- --run 2>&1; then
    ok "Todos los tests pasan"
  else
    fail "Hay tests rotos"
    EXIT_CODE=1
  fi
else
  warn "Sin runner de tests: ni profiles/active/test.sh ni package.json — tests no verificados"
fi

echo ""
echo "-- 5. Resumen -----------------------------------------------------"

if [ $EXIT_CODE -eq 0 ]; then
  ok "Entorno listo. Puedes empezar a trabajar."
else
  fail "Entorno NO esta listo. Resuelve los errores antes de avanzar."
fi

exit $EXIT_CODE

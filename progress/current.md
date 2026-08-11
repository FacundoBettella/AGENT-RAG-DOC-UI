# Sesión actual

> Este archivo se vacía al cerrar cada sesión y se mueve a `history.md`.
> Mientras trabajas, **mantenlo actualizado en tiempo real**, no al final.

- **Feature en curso:** ninguna
- **Estado:** features 10-17 DONE. 10-16 commiteadas (3bccd0a chore harness, 7f6123e
  feat 10+11, ccf542f feat 12, 92d0cc2 feat 13, 97ffc80 feat 14, e538292 feat 15+docker,
  1dc9214 fix infra tests/ en Docker, 2c4c716 feat 16, f93917d chore README+red+HMR);
  17 sin commitear todavía. Repo pusheado a
  https://github.com/FacundoBettella/AGENT-RAG-DOC-UI.git (remote "origin").
- **Full Docker**: `node_modules` local ELIMINADO — todo corre por contenedor.
  `profiles/react/test.sh` ahora usa `docker compose exec` en vez de `node
  ./node_modules/...` (adentro del contenedor Linux no existe el bug del `&` de
  Windows, así que corre `npm`/`npx` normales). Requiere Docker Desktop arriba para
  que `./init.sh`/tests funcionen — sin fallback local.
- **Red Docker simplificada**: las URLs de los backends usan `localhost` (no
  `host.docker.internal`) porque el fetch real lo hace el navegador, no el
  contenedor — client-side SPA. Esquema de puertos actual: RAG AGENT API en `8000`,
  DOC AGENT API en `8001`, front en `5173`. `vite.config.ts` tiene
  `server.watch.usePolling: true` — sin esto, Vite no detecta cambios de archivo a
  través del bind mount en Windows y sirve versiones viejas del código sin avisar
  (mordió en la feature 17: el mensaje de error viejo seguía apareciendo pese a que
  el archivo en disco ya estaba corregido). README.md ya no documenta el harness —
  solo el producto (qué es, env vars, cómo levantarlo, stack).
- **Deuda conocida sin resolver:** `source="api"` fijo en el indexer de RAG AGENT API
  (pierde el nombre real del archivo cargado desde /rag, visible en el panel de fuentes
  del chat) — requiere tocar el schema del backend externo, fuera de alcance hasta ahora.

## Completado en esta sesión

- **Feature 6 — analytics:** `analyticsService` con GA4 (`react-ga4`) + fallback `console.info`. `trackEvent` llamado desde `useHrChat` y `useRagUpload`. 153 tests verdes. Reviewer APROBADO. QA 100% efectivo.
- **Feature 7 — rag-form-v2:** Rediseño completo de `/rag` con drag & drop, validaciones (2 MB/archivo, 8 MB total, 4 archivos máx), preview de archivos, tokens Zelda. 173 tests verdes. Reviewer APROBADO. QA 100% efectivo (4 mutantes equivalentes documentados).
- **Feature 8 — header-polish:** `HeaderLink` (styled Link) envuelve ⚕ + "Mercurial" + "—" + "Consultas de RR.HH." inline. 183 tests verdes. Reviewer APROBADO (2da pasada). QA 100% sobre líneas nuevas (81% global, sobrevivientes en código preexistente).
- **Feature 9 — faq-section:** Footer global con link a `/faq`, página estática con 6 Q&As, `aria-current`, link "← Volver al chat". 200 tests verdes. Reviewer APROBADO (2da pasada). QA 100% (13/13 killed).
- **Feature 10 — design-system-shell:** migración de styled-components a Tailwind v4 (CSS-first,
  paleta MD3 light+dark) + sidebar de navegación global (Chatbot IA `/`, Analizador de Contratos
  `/contracts` placeholder, Base de conocimiento `/rag`, Configuración `/settings` placeholder),
  header con solo botón "Ayuda" → `/faq`, theme toggle reubicado al pie del sidebar, footer global
  eliminado. Modo test-after. 187 tests verdes, reviewer APROBADO. Nota de entorno: `npx`/`npm`
  rompen en esta sesión por el `&` literal en la ruta del proyecto — usar `node ./node_modules/...`
  directo para tsc/vitest (no es un bug del código, preexistente).

- **Feature 11 — hr-chat-redesign:** fix del bug real (hrService.query devolvía
  Promise<string> leyendo data.result inexistente; ahora Promise<{answer, chunks}> desde
  query_result.system_answer/chunks_related, lanza Error si inválido). Migración completa
  de HrChat a Tailwind con patrón Container. Panel "Fuentes de la respuesta" con chunks
  reales (similarity clampeado [0,100]%), sugerencias que autocompletan sin enviar +
  evento chat_suggestion_clicked. 201 tests verdes. Reviewer APROBADO (3 notas menores no
  bloqueantes: function-declaration y key={index} preexistentes, project-spec.md
  desactualizado — ya corregido con notas de "SUPERADO"). features/api-integration.feature
  @s2 actualizado en consecuencia.

- **Feature 12 — contract-analysis:** pantalla real en `/contracts` (reemplaza el
  placeholder de la feature 10). `docAgentService.analyze()` contra DOC AGENT API
  (`POST /analysis`, 2 imágenes requeridas .png/.jpg/.jpeg máx 10MB, traduce
  snake_case→camelCase). `extractBackendError` extendido para el shape `{detail}` de
  FastAPI. Rename `VITE_API_BASE_URL`→`VITE_RAG_API_BASE_URL`. Fix de CORS en
  `DOC AGENT API/src/api/app.py` (repo externo) y de `.env.local` (apuntaba al puerto
  equivocado — RAG en 8080, DOC en 8000). 227 tests verdes. Reviewer APROBADO (hallazgos
  menores no bloqueantes: function-declaration/key=index preexistentes, useMemo faltante
  en context value, constantes de validación ubicadas en el hook en vez de constants.ts).

- **Feature 13 — prompts-config:** editor de los system prompts de los agentes de DOC
  AGENT API en `/settings` (reemplaza el placeholder de la feature 10). `promptsService`
  (list/update contra GET/PUT /prompts), genérico sobre lo que devuelve el backend (no
  hardcodea los 2 agentes conocidos). Guardado en dos pasos: botón abre un modal de
  confirmación (overlay propio, no `<dialog>` nativo — no funciona en el jsdom del
  proyecto), confirmar dispara el PUT y cierra el modal sin esperar la respuesta,
  analytics `prompt_saved` antes de que resuelva la promesa. 251 tests verdes. Reviewer
  RECHAZÓ la 1ra pasada solo por faltar `specs/prompts-config/tdd.md` (trazabilidad
  @s→test, artefacto obligatorio) — agregado sin tocar código, 2da pasada APROBADA.

- **Feature 14 — rag-domain-metadata:** arregla el bug real de `ragService.upload`
  (no mandaba `domain`, obligatorio en RAG AGENT API). Selector fieldset+3 radios sin
  preselección, retema 1:1 de RagPage a Tailwind (cero tokens nuevos), elimina
  `useRagUpload` (código muerto) reconectando tracking en `useRagForm`. CORS agregado
  en `RAG AGENT API/src/api/main.py` (repo externo) — mismo criterio que DOC AGENT API
  en la feature 12. `source="api"` fijo del indexer queda fuera de alcance (requiere
  tocar el backend). 264 tests verdes. Reviewer APROBADO sin observaciones.

- **Feature 15 — fix-rag-fallback-port:** `hrService.ts`/`ragService.ts` tenían
  `'http://localhost:8000'` (puerto de DOC AGENT API) como fallback cuando
  `VITE_RAG_API_BASE_URL` no está seteada, en vez de `8080` (RAG AGENT API). Extrae
  `src/services/ragBaseUrl.ts` (`getRagBaseUrl()`, espejo de `docAgentBaseUrl.ts`) —
  resuelve deuda de `conventions.md` pedida explícitamente por el usuario, no solo el
  fix. Reviewer verificó la mordida mutando el código a mano: el naive "no stubear la
  env var" daba falso positivo porque `.env.local` ya trae `8080` seteado, filtrándose
  al proceso de vitest — los tests usan `vi.stubEnv(..., undefined)` explícito. 268
  tests verdes. Reviewer APROBADO sin observaciones.

- **Feature 16 — fix-doc-agent-baseurl-test-coupling:** `tests/PromptsService.test.ts`
  testeaba el fallback de `getDocAgentBaseUrl()` comparando contra el literal
  `'http://localhost:8000/prompts'` sin `vi.stubEnv` — mismo patrón de bug que la 15,
  esta vez para DOC AGENT API. Rompía corriendo dentro de Docker (`docker-compose.yml`
  sobreescribe la env var a `host.docker.internal:8000`). Fix distinto al de la 15: en
  vez de forzar el escenario "sin env var", el test usa `vi.mock(..., {spy:true})` y
  verifica que la función fue invocada y que la URL final se derivó de su retorno — sin
  literal de host/puerto, pasa con cualquier valor de entorno. Cero cambios en `src/`.
  268 tests verdes dentro del contenedor. Reviewer RECHAZÓ la 1ra pasada porque el diff
  incluía 4 archivos de infra Docker (Dockerfile/docker-compose.yml/.dockerignore/
  README.md) que en realidad eran un fix mío (tech-lead) sin commitear, no del
  developer — se separaron en el commit `1dc9214` y la 2da pasada APROBÓ.

- **Feature 17 — contract-analysis-docx-support:** DOC AGENT API ya soportaba `.docx`
  (python-docx, extrae párrafos y tablas) pero el frontend solo validaba/comunicaba
  imágenes. Suma `.docx` a `VALID_EXTENSIONS`, copy neutral (ya no dice "imagen"),
  ícono por tipo de archivo en la dropzone (`description`/`image`). Original y
  enmienda pueden ser de tipos distintos entre sí, sin validación cruzada. 273 tests
  verdes. Reviewer APROBADO sin cambios requeridos.

## Próximo paso

Todas las features conocidas (10-17) están DONE. Falta commitear+pushear la 17. No
queda nada más en el backlog — próximo ciclo requiere que el usuario proponga algo nuevo.

# Sesión actual

> Este archivo se vacía al cerrar cada sesión y se mueve a `history.md`.
> Mientras trabajas, **mantenlo actualizado en tiempo real**, no al final.

- **Feature en curso:** ninguna
- **Estado:** features 10, 11, 12 y 13 DONE. 10-12 commiteadas (3bccd0a chore harness,
  7f6123e feat 10+11, ccf542f feat 12); 13 sin commitear todavía. Todas las features
  sdd del backlog original (10-13) completas — solo queda 14 (rag-domain-metadata) en
  backlog, sin confirmar. Fix de entorno en `profiles/react/test.sh` (no
  `profiles/active/`, que init.sh regenera cada corrida).
- **Backlog:** 14 — rag-domain-metadata (bug real: ragService.ts no manda `domain`, que
  RAG AGENT API exige en POST /api/ingest; un dominio por carga). También candidato para
  arreglar que /api/ingest indexa con source="api" fijo (pierde nombre de archivo real,
  visible ahora en el panel de fuentes de la feature 11). No arrancar sin confirmación.

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

## Próximo paso

Todas las features del backlog original (10-13) están DONE. Falta commitear la 13.
Queda 14 (rag-domain-metadata) en backlog, sin confirmar si se arranca.

# Sesión actual

> Este archivo se vacía al cerrar cada sesión y se mueve a `history.md`.
> Mientras trabajas, **mantenlo actualizado en tiempo real**, no al final.

- **Feature en curso:** ninguna
- **Estado:** features 10 y 11 DONE. Pendientes desbloqueadas: 12 (contract-analysis),
  13 (prompts-config). Fix de entorno en `profiles/react/test.sh` (no `profiles/active/`,
  que init.sh regenera cada corrida) — ver nota más abajo.
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

## Próximo paso

Elegir entre: 12 (contract-analysis), 13 (prompts-config) — ambas desbloqueadas —
o retomar 14 (rag-domain-metadata) del backlog.

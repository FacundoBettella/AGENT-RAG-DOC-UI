# CHECKPOINTS — Evaluación del estado final

> En sistemas multi-agente no se evalúa el camino, se evalúa el destino.
> Estos son los checkpoints objetivos que un juez (humano o IA) puede usar
> para decidir si el proyecto está sano.

## C1 — El arnés está completo

- [ ] Existen los 4 archivos base: `AGENTS.md`, `init.sh`, `feature_list.json`,
      `CHECKPOINTS.md`.
- [ ] `./init.sh` termina con exit code 0.

## C2 — El estado es coherente

- [ ] En modo individual: como maximo una feature en `in_progress`.
- [ ] En modo squad: como maximo una feature `in_progress` por `owner`.
- [ ] Toda feature `done` tiene tests asociados que pasan.
- [ ] No se versionan bitácoras personales (`progress/current.md`,
      `progress/history.md`).

## C3 — El código respeta la arquitectura

- [ ] `src/` solo contiene las capas previstas en `[]/docs/architecture.md`.
- [ ] Ningún componente llama a `fetch` / `axios` directamente.
- [ ] No hay `any` en TypeScript sin justificación documentada.
- [ ] No hay `console.log` de debug ni TODOs sin contexto.

## C4 — La verificación es real

- [ ] `tests/` (o `src/**/*.test.tsx`) tiene al menos un test por módulo
      expuesto en `src/`.
- [ ] Los tests usan `@testing-library/react` (RTL): queries por rol
      accesible (`getByRole`, `getByLabelText`), no por `className`.
- [ ] Los services se mockean; no se hacen llamadas HTTP reales en los tests.
- [ ] `npm test -- --run` muestra > 0 tests y todos verdes.

## C5 — La sesión se cerró bien

- [ ] No hay archivos sin trackear sospechosos (`*.tmp` fuera del `.gitignore`).
- [ ] La última feature trabajada está reflejada en su estado correcto.

## C6 — Contrato Gherkin (BDD)

- [ ] Toda feature con `"sdd": true` en estado `spec_ready`, `in_progress`
      o `done` tiene su `features/<name>.feature`.
- [ ] El `.feature` usa Gherkin con escenarios tagueados `@s1`, `@s2`, …
      y cada `Then` afirma algo medible (ver `[]/docs/gherkin.md`).
- [ ] Cada escenario `@s` está cubierto por al menos un test concreto en
      `tests/`.

## C7 — Prueba de mutación

- [ ] La feature `done` superó la prueba de mutación
      (`node tools/mutate.mjs src/<archivo>.ts`) con la puntuación por
      encima del umbral de `[]/docs/mutation-testing.md`.

**Cómo usar este archivo:** el agente `reviewer` (`.claude/agents/reviewer.md`)
recorre C1-C6 y el `qa` valida C7. Se rechaza el cierre de
sesión si quedan boxes vacíos.

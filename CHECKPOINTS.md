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
- [ ] No se versiona la bitácora personal (`progress/current.md`).

## C3 — El código respeta la arquitectura

- [ ] `src/` solo contiene las capas previstas en `docs/architecture.md`.
- [ ] Las llamadas a servicios externos (HTTP, DB) viven en la capa de
      servicios — nunca en la capa de presentación o de entrada.
- [ ] No hay logs de debug ni TODOs sin contexto.
- [ ] Los checks específicos del stack (tipado, patrones del framework) se
      aplican desde `profiles/active/reviewer-checklist.md` (capa de perfil).

## C4 — La verificación es real

- [ ] Cada módulo expuesto en `src/` tiene al menos un test.
- [ ] Los tests verifican comportamiento observable, no implementación
      interna (los patrones concretos del stack: capa de perfil).
- [ ] Los servicios externos se mockean; no hay llamadas reales en los tests.
- [ ] La suite del perfil activo (`bash profiles/active/test.sh`) muestra al
      menos un test y todos verdes. Sin perfil activo, el fallback depende
      del stack detectado en el proyecto — ver `docs/verification.md`.

## C5 — La sesión se cerró bien

- [ ] No hay archivos sin trackear sospechosos (`*.tmp` fuera del `.gitignore`).
- [ ] La última feature trabajada está reflejada en su estado correcto.

## C6 — Contrato Gherkin (BDD)

- [ ] Toda feature con `"sdd": true` en estado `spec_ready`, `in_progress`
      o `done` tiene su `features/<name>.feature`.
- [ ] El `.feature` usa Gherkin con escenarios tagueados `@s1`, `@s2`, …
      y cada `Then` afirma algo medible (ver `docs/gherkin.md`).
- [ ] Cada escenario `@s` está cubierto por al menos un test concreto en
      `tests/`.

**Cómo usar este archivo:** el agente `reviewer` (`.claude/agents/reviewer.md`)
recorre C1-C6. Se rechaza el cierre de sesión si quedan boxes vacíos.

# AGENTS.md — Mapa de navegación para agentes de IA

> Punto de entrada para cualquier agente que trabaje en este repositorio.
> NO es una biblia de reglas: es un **mapa**. Leé solo lo que necesitás
> cuando lo necesitás (divulgación progresiva).
>
> **Rama `uncle-bob-harness`** — flujo estilo Robert C. Martin:
> conversación → Gherkin → TDD → review → mutación. Ver `docs/workflow.md`.

---

## 1. Antes de empezar (obligatorio)

1. Ejecutá `./init.sh` y verificá que termina sin errores. Si falla, **pará**
   y resolvé el entorno antes de tocar código.
2. Si existe, leé `progress/current.md` para recuperar tu contexto local.
3. Leé `feature_list.json`. Toda feature nueva (`"sdd": true`) recorre el
   pipeline de cinco fases — ver `docs/workflow.md` y §4.
4. Leé `docs/workflow.md` antes de coordinar nada.

## 2. Mapa del repositorio

| Archivo / carpeta            | Qué contiene                                                                | Cuándo leerlo |
|------------------------------|-----------------------------------------------------------------------------|---------------|
| `feature_list.json`          | Lista de tareas con estado y owner opcional (`pending` / `spec_ready` / `in_progress` / `done` / `blocked`) | Siempre, al empezar |
| `progress/current.md`        | Estado de sesión local (personal, no versionado en squad mode)             | Opcional, al empezar |
| `progress/history.md`        | Bitácora histórica local (personal, no versionada en squad mode)           | Opcional |
| `project-spec.md`            | Spec conversada: propósito, contrato y decisiones por feature               | Antes de destilar Gherkin o implementar |
| `features/<name>.feature`    | Escenarios Gherkin (el contrato ejecutable que el humano aprueba)           | Antes de empezar el ciclo TDD |
| `docs/workflow.md`           | El pipeline completo y los insights de cada fase                            | Antes de coordinar |
| `docs/tdd.md`                | Las Tres Leyes del TDD; el ciclo Rojo-Verde-Refactor                        | Antes de escribir código |
| `docs/gherkin.md`            | Cómo escribir `.feature`; de Gherkin a test                                 | Antes de redactar/leer escenarios |
| `docs/mutation-testing.md`   | Por qué y cómo; umbral; uso de `tools/mutate.mjs`                           | Antes de validar la suite |
| `docs/architecture.md`       | Qué significa "hacer un buen trabajo" en este proyecto                      | Antes de implementar |
| `docs/conventions.md`        | Reglas de estilo, nombres, estructura                                       | Antes de escribir código |
| `docs/verification.md`       | Cómo verificar que tu trabajo funciona                                      | Antes de declarar `done` |
| `CHECKPOINTS.md`             | Criterios objetivos de "estado final correcto"                              | Para auto-evaluarte |
| `tools/mutate.mjs`           | Mutador sin dependencias para la prueba de mutación                         | Fase de mutación |
| `.claude/agents/`            | `tech-lead`, `analyst`, `bdd-writer`, `developer`, `reviewer`, `qa`        | Si orquestás trabajo |
| `src/`                       | Código de la aplicación React (services, hooks, components, features, pages, store, router) | Para implementar |
| `tests/`                     | Tests automáticos (*.test.tsx, *.test.ts)                                   | Para verificar   |

## 3. Reglas duras (no negociables)

- **Modo individual:** una sola feature a la vez.
- **Modo squad:** máximo una `in_progress` por `owner`.
- **No declarés una tarea `done` sin pruebas verdes Y umbral de mutación
  superado.** Ejecutá `./init.sh` y la prueba de mutación.
- **No saltés la conversación de spec ni la destilación Gherkin.** Toda
  feature con `"sdd": true` pasa por `analyst` y `bdd-writer`.
- **No saltés la puerta de aprobación humana** sobre los `.feature`. El
  `tech-lead` detiene el flujo en `spec_ready` y espera.
- **TDD estricto: un test a la vez.** Nada de producción sin un test rojo
  que la pida (`docs/tdd.md`).
- **No subás bitácoras personales** (`progress/current.md`, `progress/history.md`).
- **Dejá el repositorio limpio** antes de cerrar la sesión (ver §5).
- **Si no sabés algo, buscá en `docs/`** antes de inventarlo.

## 4. Flujo de trabajo (pipeline)

```
pending
  → [analyst]    conversación → project-spec.md
  → [bdd-writer] project-spec.md → features/<name>.feature   (status: spec_ready)
  → ⏸ HUMANO APRUEBA los escenarios
  → in_progress
  → [developer]  Rojo → Verde → Refactor (un test a la vez)
  → [reviewer]   review (el juego entero)
  → [qa]         mata mutantes; valida que los tests muerden
  → done
```

1. El `tech-lead` detecta la primera feature `pending` con `"sdd": true`.
2. Lanza `analyst` (conversa y debate) → `project-spec.md`.
3. Lanza `bdd-writer` → `features/<name>.feature`, status `spec_ready`.
4. **Pausa.** El humano lee los escenarios y aprueba (o pide cambios).
5. Aprobado → status `in_progress` y lanza `developer`.
6. El `developer` recorre cada escenario `@s` con ciclos Rojo-Verde-Refactor.
7. El `reviewer` revisa cobertura, disciplina TDD y calidad; aprueba o rechaza.
8. El `qa` corre `tools/mutate.mjs`; exige el umbral.
9. Si todo pasa, el `developer` marca `done`.

## 5. Cierre de sesión (lifecycle)

Antes de terminar:

1. Ejecutá `./init.sh` — todo verde.
2. Corré la prueba de mutación sobre lo tocado — superá el umbral.
3. Si la tarea está acabada: marcá `status: "done"` en `feature_list.json`.
4. Si usás bitácora local, mantenela fuera del repo.
5. No dejes ruido de merge en archivos personales.
6. No dejes archivos temporales, ni `console.log` de debug, ni TODOs sin contexto.

## 6. Si te bloqueás

- Releé la sección relevante de `docs/`.
- Si la herramienta no hace lo que esperás, **no inventes un workaround**:
  documentá el bloqueo en `progress/current.md` y pará la sesión.

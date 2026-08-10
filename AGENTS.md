# AGENTS.md — Mapa de navegación para agentes de IA

> Punto de entrada para cualquier agente que trabaje en este repositorio.
> NO es una biblia de reglas: es un **mapa**. Leé solo lo que necesitás
> cuando lo necesitás (divulgación progresiva).
>
> **Rama `uncle-bob-harness`** — flujo estilo Robert C. Martin:
> conversación → Gherkin → implementación (TDD o test-after) → review.
> Ver `docs/workflow.md`.

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
| `project-spec.md`            | Overview de proyecto + índice con links a `specs/<name>/spec.md`            | Para orientarse; no leer completo por feature |
| `specs/<name>/spec.md`       | Spec de la feature: Propósito + Contrato + Decisiones                       | Antes de destilar Gherkin o implementar |
| `specs/<name>/tdd.md`        | Mapa `@s → test` (trazabilidad obligatoria, versionada)                     | Al revisar cobertura |
| `features/<name>.feature`    | Escenarios Gherkin (el contrato ejecutable que el humano aprueba)           | Antes de empezar a implementar |
| `docs/workflow.md`           | El pipeline completo y los insights de cada fase                            | Antes de coordinar |
| `docs/tdd.md`                | Las Tres Leyes del TDD; el ciclo Rojo-Verde-Refactor (modo TDD estricto)    | Antes de escribir código, si el humano eligió TDD |
| `docs/testing-test-after.md` | Protocolo del modo alternativo: implementar y testear después              | Antes de escribir código, si el humano eligió test-after |
| `docs/gherkin.md`            | Cómo escribir `.feature`; de Gherkin a test                                 | Antes de redactar/leer escenarios |
| `profiles/active/docs/architecture.md` | Qué significa "hacer un buen trabajo" para el stack activo (genérico si no hay perfil, no define nada) | Antes de implementar |
| `profiles/active/docs/conventions.md`  | Reglas de estilo, nombres, estructura del stack activo (genérico si no hay perfil, no define nada) | Antes de escribir código |
| `docs/verification.md`       | Cómo verificar que tu trabajo funciona                                      | Antes de declarar `done` |
| `docs/skills.md`             | Por qué las skills se invocan on-demand (no preload); cómo se nombran       | Si mantenés las tablas de skills de los agentes |
| `docs/token-economics.md`    | Postura del harness sobre token economics y lectura dirigida                | Si optimizás el flujo de contexto |
| `CHECKPOINTS.md`             | Criterios objetivos de "estado final correcto"                              | Para auto-evaluarte |
| `.claude/agents/`            | `tech-lead`, `analyst`, `bdd-writer`, `developer`, `reviewer`              | Si orquestás trabajo |

> `src/` y `tests/` **no están en este repo**. Viven en el repo consumidor, en el stack que declare su perfil activo (react, java-spring, python-fastapi). Este harness solo publica los contratos (`features/`). Los agentes `developer` y `reviewer` operan sobre esos directorios en el contexto del repo consumidor.

### Por qué existe `specs/<feature>/spec.md`

Los agentes arrancan en frío en cada sesión: no tienen memoria de conversaciones anteriores. `specs/<feature>/spec.md` es la **memoria escrita del debate** entre el humano y el `analyst` — guarda las decisiones y sus razones antes de que se escriba una línea de código.

Sin él, el `developer` solo ve el contrato Gherkin (el *qué*) pero no sabe el *por qué*: qué alternativas se descartaron, qué casos límite se acordaron, qué restricciones de diseño aplican. Eso genera código que cumple el `.feature` pero viola decisiones que nunca quedaron explícitas.

La cadena de uso es:

```
specs/<name>/spec.md  →  bdd-writer: lo lee para escribir el .feature con fidelidad
                      →  developer:  lo lee para saber qué implementar y por qué
                      →  reviewer:   lo lee para saber si el código respeta lo acordado
```

El `.feature` es el contrato ejecutable (lo que se prueba). `specs/<name>/spec.md` es el razonamiento detrás del contrato (por qué ese comportamiento y no otro).

---

## 3. Reglas duras (no negociables)

- **Modo individual:** una sola feature a la vez.
- **Modo squad:** máximo una `in_progress` por `owner`.
- **No declarés una tarea `done` sin pruebas verdes.** Ejecutá `./init.sh`
  antes de cerrar.
- **No saltés la conversación de spec ni la destilación Gherkin.** Toda
  feature con `"sdd": true` pasa por `analyst` y `bdd-writer`.
- **No saltés la puerta de aprobación humana** sobre los `.feature`. El
  `tech-lead` detiene el flujo en `spec_ready` y espera.
- **No saltés la elección de modo.** Antes de lanzar al `developer`, el
  `tech-lead` pregunta al humano: TDD estricto (`docs/tdd.md`, un test a
  la vez, nada de producción sin un test rojo que la pida) o test-after
  (`docs/testing-test-after.md`, implementar y testear después). En
  cualquier modo, ningún `@s` queda sin al menos un test concreto que lo
  verifique.
- **No subás bitácoras personales** (`progress/current.md`).
- **Dejá el repositorio limpio** antes de cerrar la sesión (ver §5).
- **Si no sabés algo, buscá en `docs/`** antes de inventarlo.

## 4. Flujo de trabajo (pipeline)

```
pending
  → [analyst]    conversación → specs/<name>/spec.md
  → [bdd-writer] specs/<name>/spec.md → features/<name>.feature   (status: spec_ready)
  → ⏸ HUMANO APRUEBA los escenarios
  → ⏸ HUMANO ELIGE modo: TDD estricto o test-after
  → in_progress
  → [developer]  TDD (Rojo→Verde→Refactor) o test-after → specs/<name>/tdd.md
  → [reviewer]   review (el juego entero)
  → done
```

1. El `tech-lead` detecta la primera feature `pending` con `"sdd": true`.
2. Lanza `analyst` (conversa y debate) → `specs/<feature>/spec.md`.
3. Lanza `bdd-writer` → `features/<name>.feature`, status `spec_ready`.
4. **Pausa.** El humano lee los escenarios y aprueba (o pide cambios).
5. **Pausa.** El `tech-lead` pregunta el modo de implementación (TDD estricto o test-after) para esa feature.
6. Aprobado y con modo elegido → status `in_progress` y lanza `developer` con el modo elegido.
7. El `developer` implementa en el modo indicado (ver `docs/tdd.md` o `docs/testing-test-after.md`) y escribe `specs/<feature>/tdd.md` con el modo usado y el mapa `@s → test`.
8. El `reviewer` revisa cobertura, disciplina de testing (según el modo) y calidad; aprueba o rechaza.
9. Si aprueba, el `developer` marca `done`.

## 5. Cierre de sesión (lifecycle)

Antes de terminar:

1. Ejecutá `./init.sh` — todo verde.
2. Si la tarea está acabada: marcá `status: "done"` en `feature_list.json`.
3. Si usás bitácora local, mantenela fuera del repo (`progress/current.md` está gitignoreado).
4. No dejes ruido de merge en archivos personales.
5. No dejes archivos temporales, ni `console.log` de debug, ni TODOs sin contexto.

## 6. Si te bloqueás

- Releé la sección relevante de `docs/`.
- Si la herramienta no hace lo que esperás, **no inventes un workaround**:
  documentá el bloqueo en `progress/current.md` y pará la sesión.

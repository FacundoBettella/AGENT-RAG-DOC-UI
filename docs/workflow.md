# El flujo Uncle Bob (Harness Engineering, edición artesano — React)

> Esta rama organiza el desarrollo de un **frontend React** alrededor del
> proceso que Robert C. Martin describe en su hilo: **conversar la spec,
> destilarla en escenarios Gherkin, tallar el código con TDD estricto,
> podar con juicio y validar con prueba de mutación**. El dominio de la app
> es deliberadamente simple; lo que enseña el repo es el *proceso*.

## El pipeline de un vistazo

```
pending
  │  analyst — CONVERSACIÓN  ─────────────────────►  project-spec.md
  │      "We debate various topics and decisions."
  │
  │  bdd-writer — DESTILACIÓN ─────────────────────►  features/<name>.feature
  │      ".feature files from the project-spec.md"
  │
  ▼  ⏸  PUERTA HUMANA: el humano aprueba los escenarios (el contrato)
  │
in_progress
  │  developer — ROJO → VERDE → REFACTOR ──────────►  src/ + tests/
  │      un test a la vez; las Tres Leyes del TDD; RTL + Vitest
  │
  │  reviewer — REVIEW ────────────────────────────►  veredicto de review
  │      "The review step is the whole game. Agents draft, judgment prunes."
  │
  │  qa — MUTACIÓN ────────────────────────────────►  score de mutación
  │      "Mutation testing is resource-heavy, but the ROI is worth every cycle."
  ▼
done
```

Una sola feature a la vez. Una sola puerta de aprobación humana: sobre los
escenarios Gherkin, **antes** de escribir producción.

## Por qué este orden (los insights del hilo)

### 1. La spec nace de una conversación, no de un dictado

El humano no entrega un documento cerrado. Debate con el `analyst`:
casos límite, contratos de salida, alternativas descartadas. El resultado,
`project-spec.md`, es el acuerdo razonado — incluidas las **decisiones** y
su porqué. Una spec sin debate esconde los huecos; el debate los saca.

### 2. Gherkin convierte la prosa en un contrato ejecutable

> "Once the project-spec.md is done, I have it create a set of .feature files."

Cada comportamiento se vuelve un `Scenario` con `Given/When/Then`
verificable. Esto es lo que el humano firma. A partir de aquí, la
ambigüedad es un bug del contrato, no del código. Ver `docs/gherkin.md`.

### 3. La puerta humana va sobre el contrato, no sobre el código

Aprobar tarde (cuando ya hay código) es caro. Aprobar el `.feature` es
barato y es el punto de máximo apalancamiento: un escenario mal definido
arrastra todo el TDD. El `tech-lead` **para** aquí y espera.

### 4. TDD estricto: un test a la vez

> "single test followed by code (TDD)"

No se escriben todos los tests por adelantado. Se vive el ciclo pequeño:
un test rojo → el mínimo verde → refactor en verde. Las Tres Leyes en
`docs/tdd.md`. El código que ningún test pidió no existe.

### 5. El review es el juego entero

> "Agents draft, judgment prunes."

Generar borradores es barato (el modelo teclea infinito). El valor escaso
es el **juicio** que decide qué sobrevive. El `reviewer` no edita: poda. Si un
escenario no tiene test, o hay código que nadie pidió, rechaza.

### 6. La validación es el nuevo cuello de botella, y es compute-bound

> "Raw computer power is the limiting factor." / "Mutation testing is resource-heavy, but the ROI on code correctness is worth every cycle."

Una suite verde solo dice que el código no explota, no que los tests
sirvan. La prueba de mutación introduce defectos y exige que algún test
falle. Es cara en CPU —reejecuta la suite por cada mutante— pero es la
medida real de si la red atrapa peces. Ver `docs/mutation-testing.md`.

## Mapa de artefactos (quién escribe qué)

| Archivo                          | Lo escribe             | Contiene                                            |
|----------------------------------|------------------------|-----------------------------------------------------|
| `project-spec.md`                | analyst                | Spec conversada: propósito, contrato, decisiones    |
| `features/<name>.feature`        | bdd-writer             | Escenarios Gherkin `@s1..@sn` (el contrato firmado) |
| `src/`, `tests/`                 | developer              | Código y tests, tallados por TDD                    |
| `specs/<name>/` (opcional)       | agentes                | Registro opcional de TDD/review/mutación            |
| `feature_list.json`              | tech-lead / developer  | `pending → spec_ready → in_progress → done`         |

Regla anti-teléfono-descompuesto: los subagentes escriben en disco y
devuelven una línea de referencia. El contenido no circula por chat.

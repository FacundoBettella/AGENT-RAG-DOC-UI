# El flujo Uncle Bob (Harness Engineering, edición artesano)

> Este flujo organiza el desarrollo alrededor del proceso que Robert C.
> Martin describe en su hilo: **conversar la spec, destilarla en escenarios
> Gherkin, tallar el código con TDD estricto (o test-after, si el humano lo
> prefiere para esa feature) y podar con juicio**. Lo que enseña este doc
> es el *proceso* — es agnóstico al stack; las menciones concretas (RTL,
> Vitest) son del perfil react y tu perfil activo tiene sus equivalentes en
> `profiles/active/`.

## El pipeline de un vistazo

```
pending
  │  analyst — CONVERSACIÓN  ─────────────────────►  specs/<name>/spec.md
  │      "We debate various topics and decisions."
  │
  │  bdd-writer — DESTILACIÓN ─────────────────────►  features/<name>.feature
  │      ".feature files from the spec"
  │
  ▼  ⏸  PUERTA HUMANA: el humano aprueba los escenarios (el contrato)
  │
  │  ⏸  PUERTA HUMANA: ¿TDD estricto o test-after? (por feature)
  │
in_progress
  │  developer — TDD (Rojo→Verde→Refactor) o test-after ───►  src/ + tests/ + specs/<name>/tdd.md
  │      TDD: un test a la vez, las Tres Leyes. Test-after: implementa y
  │      luego blinda con tests que muerden. Ver docs/tdd.md y
  │      docs/testing-test-after.md.
  │
  │  reviewer — REVIEW ────────────────────────────►  veredicto de review
  │      "The review step is the whole game. Agents draft, judgment prunes."
  ▼
done
```

Una sola feature a la vez. Dos puertas humanas, ambas **antes** de que
exista producción: los escenarios Gherkin (el contrato) y el modo de
implementación (TDD o test-after, por feature).

## Por qué este orden (los insights del hilo)

### 1. La spec nace de una conversación, no de un dictado

El humano no entrega un documento cerrado. Debate con el `analyst`:
casos límite, contratos de salida, alternativas descartadas. El resultado,
`specs/<feature>/spec.md`, es el acuerdo razonado — incluidas las **decisiones** y
su porqué. Una spec sin debate esconde los huecos; el debate los saca.

**Protocolo batch-first:** como el `analyst` corre como subagente, cada
pregunta al humano viaja `analyst → tech-lead → humano → tech-lead → analyst`
(dos saltos de agente + una espera humana). Para no pagar ese peaje por
pregunta, el `analyst` abre siempre con un **mensaje-panorama**: todas sus
preguntas en un solo mensaje, separadas en *para responder de una* (cada una
con recomendación y fundamento citado — un precedente o una razón concreta)
y *para debatir* (las encadenadas o estructurales). El humano contesta "ok a
todo" a lo trivial y el ida y vuelta queda reservado para lo que lo merece.
Las decisiones que repiten un precedente se **heredan por referencia**
(`hereda Decisión N de specs/<hermana>/spec.md`) en vez de re-redactarse.
El tech-lead pasa los specs precedentes en el prompt de lanzamiento.
Spec de esta mejora: feature #17 `spec-rigor-calibration`.

### 2. Gherkin convierte la prosa en un contrato ejecutable

> "Once the spec is done, I have it create a set of .feature files."

Cada comportamiento se vuelve un `Scenario` con `Given/When/Then`
verificable. Esto es lo que el humano firma. A partir de aquí, la
ambigüedad es un bug del contrato, no del código. Ver `docs/gherkin.md`.

### 3. La puerta humana va sobre el contrato, no sobre el código

Aprobar tarde (cuando ya hay código) es caro. Aprobar el `.feature` es
barato y es el punto de máximo apalancamiento: un escenario mal definido
arrastra todo el TDD. El `tech-lead` **para** aquí y espera.

### 4. TDD por defecto, pero es una elección del humano

> "single test followed by code (TDD)"

El modo por defecto de este harness es TDD estricto: un test rojo → el
mínimo verde → refactor en verde, sin escribir toda la batería por
adelantado. Las Tres Leyes en `docs/tdd.md`. El código que ningún test
pidió no existe.

Pero TDD estricto es una disciplina cara (un ciclo por escenario, muchas
corridas de suite) y no siempre es el trade-off que el humano quiere para
una feature dada. Por eso, **antes de lanzar al `developer`**, el
`tech-lead` pregunta: ¿TDD estricto o implementación directa con tests
posteriores ("test-after")? Es una puerta humana más, liviana, feature
por feature — no un ajuste global.

Lo que **no** es negociable en ningún modo: cada escenario `@s` del
`.feature` termina cubierto por al menos un test concreto que confirme el
comportamiento (camino feliz y, si aplica, camino de error), y ese test
tiene que morder — pasar si el código está bien, fallar si se rompe. En
TDD eso lo garantiza el ciclo Rojo→Verde. En test-after lo garantiza el
protocolo de `docs/testing-test-after.md`: implementar, escribir el test
después, y demostrar a mano que falla si se rompe la implementación.
`specs/<feature>/tdd.md` registra qué modo se usó.

### 5. El review es el juego entero

> "Agents draft, judgment prunes."

Generar borradores es barato (el modelo teclea infinito). El valor escaso
es el **juicio** que decide qué sobrevive. El `reviewer` no edita: poda. Si un
escenario no tiene test, o hay código que nadie pidió, rechaza.

## Mapa de artefactos (quién escribe qué)

| Archivo                          | Lo escribe             | Contiene                                            |
|----------------------------------|------------------------|-----------------------------------------------------|
| `project-spec.md`                | tech-lead (índice)     | Overview de proyecto + índice de features con links |
| `specs/<name>/spec.md`           | analyst                | Propósito + Contrato + Decisiones de la feature     |
| `features/<name>.feature`        | bdd-writer             | Escenarios Gherkin `@s1..@sn` (el contrato firmado) |
| `src/`, `tests/`                 | developer              | Código y tests, en TDD o test-after (elección humana) |
| `specs/<name>/tdd.md`            | developer              | Modo usado + mapa `@s → test` (trazabilidad obligatoria) |
| `feature_list.json`              | tech-lead / developer  | `pending → spec_ready → in_progress → done`         |

Regla anti-teléfono-descompuesto: los subagentes escriben en disco y
devuelven una línea de referencia. El contenido no circula por chat.

Regla de lectura dirigida: el `bdd-writer` y el `reviewer` leen **solo**
`specs/<feature>/spec.md` de la feature en curso — no el proyecto entero.

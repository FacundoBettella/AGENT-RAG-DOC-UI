# El flujo del harness (Harness Engineering, edición artesano)

> Este flujo organiza el desarrollo en cuatro pasos: **conversar la spec,
> destilarla en escenarios Gherkin, tallar el código con TDD estricto (o
> test-after, si el humano lo prefiere para esa feature) y podar con
> juicio**. Lo que enseña este doc es el *proceso* — es agnóstico al stack;
> las menciones concretas (RTL, Vitest) son del perfil react y tu perfil
> activo tiene sus equivalentes en `profiles/active/`.

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
  │  developer — TDD (Rojo→Verde→Refactor) o test-after ───►  src/ + tests/ + specs/<name>/testing.md
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
`specs/<feature>/testing.md` registra qué modo se usó.

### 5. El review es el juego entero

> "Agents draft, judgment prunes."

Generar borradores es barato (el modelo teclea infinito). El valor escaso
es el **juicio** que decide qué sobrevive. El `reviewer` no edita: poda. Si un
escenario no tiene test, o hay código que nadie pidió, rechaza.

### 6. El camino rápido: `sdd: false`

El pipeline de arriba tiene un costo real (dos fases + una puerta humana) que
tiene sentido cuando el comportamiento merece discutirse y documentarse. No
siempre lo merece: a veces el humano ya sabe exactamente qué cambio quiere y
no necesita conversarlo con el `analyst`. Forzar la ceremonia completa ahí
frena sin agregar valor.

La salida no es un mecanismo nuevo — es el flag `sdd` que ya vive en el
schema de `feature_list.json` (`sdd_required_when: "feature has \"sdd\":
true"`), formalizado en el protocolo del `tech-lead`:

```
pending → in_progress → developer → reviewer → done
```

Se saltean `analyst`, `bdd-writer` y la puerta de aprobación de escenarios
(no hay `.feature` que aprobar). Todo lo demás es igual: la elección de modo
(TDD o test-after), el `developer` implementando con tests reales, la puerta
visual si aplica, y el `reviewer` — nunca se saltea, es el paso que
efectivamente protege la calidad, con o sin Gherkin de por medio.

**La decisión es siempre del humano, nunca del `tech-lead`.** Igual que la
elección de modo no se infiere ni se hereda, "esto es un cambio menor" no se
deduce del tamaño del diff — un cambio de tres líneas en lógica de permisos
no es "menor" en el sentido que importa. El `tech-lead` nunca decide esto
por su cuenta.

**El registro no se saltea nunca.** La feature vive en `feature_list.json`
con `"sdd": false` igual que cualquier otra — es el único ledger que queda
una vez que no hay spec ni Gherkin, y las reglas de `team_mode` y
`max_in_progress_per_owner` dependen de que toda feature en curso esté ahí.

## Mapa de artefactos (quién escribe qué)

| Archivo                          | Lo escribe             | Contiene                                            |
|----------------------------------|------------------------|-----------------------------------------------------|
| `project-spec.md`                | tech-lead (índice)     | Overview de proyecto + índice de features con links |
| `specs/<name>/spec.md`           | analyst                | Propósito + Contrato + Decisiones de la feature (solo `sdd: true`) |
| `features/<name>.feature`        | bdd-writer              | Escenarios Gherkin `@s1..@sn` (el contrato firmado, solo `sdd: true`) |
| `src/`, `tests/`                 | developer              | Código y tests, en TDD o test-after (elección humana) |
| `specs/<name>/testing.md`        | developer              | Modo usado + mapa `@s → test` (`sdd: true`) o lista de tests (`sdd: false`) — trazabilidad obligatoria en ambos casos |
| `feature_list.json`              | tech-lead / developer  | `pending → spec_ready → in_progress → done`         |

Regla anti-teléfono-descompuesto: los subagentes escriben en disco y
devuelven una línea de referencia. El contenido no circula por chat.

Regla de lectura dirigida: el `bdd-writer` y el `reviewer` leen **solo**
`specs/<feature>/spec.md` de la feature en curso — no el proyecto entero.

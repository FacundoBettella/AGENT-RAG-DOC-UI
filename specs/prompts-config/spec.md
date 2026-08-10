# prompts-config — spec

> Estado: **cerrada**. Sin preguntas abiertas. Lista para destilar Gherkin.
>
> PA-1 (¿guardar directo o confirmación?) la resolvió el humano: **modal de confirmación
> antes del `PUT`** (Decisión 11). PA-2 (restaurar prompt por defecto) queda confirmada
> fuera de alcance; se conserva como §Nota de alcance porque exige trabajo de backend.
>
> Precedentes: `specs/design-system-shell/spec.md` (feature 10, `done`),
> `specs/hr-chat-redesign/spec.md` (feature 11, `done`) y
> `specs/contract-analysis/spec.md` (feature 12, `done`). Tokens, tipografía, iconos,
> patrón Container + presentacionales, `extractBackendError`, error inline y mapeo a
> camelCase se **heredan** de ahí; esta spec solo declara lo que agrega o cambia.

## Propósito

Reemplazar el placeholder de `/settings` por la pantalla que lee y edita los system prompts
de los agentes de DOC AGENT API vía `GET /prompts` y `PUT /prompts/{agent_name}`.

## Contrato

### Alcance

**Dentro:**

- `src/services/promptsService.ts` (nuevo) — cliente de `GET /prompts` y `PUT /prompts/{agent}`.
- `src/services/docAgentBaseUrl.ts` (nuevo) — resolución de `VITE_DOC_AGENT_API_BASE_URL`,
  extraída de `docAgentService.ts` (ver Decisión 3).
- `src/services/docAgentService.ts` — pasa a importar `getDocAgentBaseUrl()`. Sin cambio de
  comportamiento; no requiere escenario Gherkin propio.
- `src/hooks/usePromptsConfig.ts` (nuevo) — carga, borrador y guardado por agente.
- `src/features/PromptsConfig/` (nuevo) — Container + presentacionales.
- `src/pages/SettingsPage.tsx` — deja de ser placeholder y monta el Container.
- `src/constants/apiRoutes.ts` — se agrega `PROMPTS`.
- `src/services/analyticsService.ts` — un `EventName` nuevo.
- `tests/DesignSystemShell.test.tsx` — su `@s2` afirma que `/settings` muestra
  "Próximamente" (línea 63); deja de ser cierto y se ajusta.

**Fuera:**

- `HrChat`, `RagPage`, `FaqPage`, `ContractsPage` y el shell: no se tocan.
- Alta y baja de agentes: el backend no expone endpoints y los dos agentes son constantes
  de código (`src/constants/agents.py`).
- Restaurar el prompt por defecto (ver §Nota de alcance), historial de versiones, diff contra
  el prompt anterior, exportar/importar prompts, probar un prompt desde la UI.
- Autenticación: el backend no la tiene y esta feature no la inventa.
- Responsive/mobile — hereda Decisión 20 de `design-system-shell`.
- `GET /prompts/{agent_name}`: existe en el backend pero esta pantalla no lo usa
  (ver Decisión 5).

### Entradas

- **Mockup de referencia: no hay.** A diferencia de las features 10 y 12, esta pantalla no
  tiene HTML de referencia en `progress/mockups/`. El diseño se deriva de los tokens de
  `src/index.css` y de la estructura de cards ya implementada en `/contracts`.
- **Backend**: DOC AGENT API, misma base URL que la feature 12
  (`VITE_DOC_AGENT_API_BASE_URL`, fallback `http://localhost:8000`). **No** se agrega
  variable de entorno nueva. CORS ya resuelto en la feature 12.
- **Datos**: los dos prompts reales pesan 1.018 y 1.726 caracteres, en español, varios
  párrafos con saltos de línea. El editor se dimensiona para ese tamaño, no para un input
  de una línea.

### Contrato de `promptsService`

Respuesta real del backend (verificada en `DOC AGENT API/src/api/prompts.py`):

```jsonc
// GET /prompts  → 200
[
  { "agent_name": "contextualization_agent", "system_prompt": "Sos un Analista…" },
  { "agent_name": "extraction_agent",        "system_prompt": "Sos un Auditor…" }
]

// PUT /prompts/{agent_name}  body { "system_prompt": "…" }  → 200
{ "agent_name": "extraction_agent", "system_prompt": "…" }
```

Firma:

```ts
export interface AgentPrompt {
  agentName: string
  systemPrompt: string
}

list(): Promise<AgentPrompt[]>
update(agentName: string, systemPrompt: string): Promise<AgentPrompt>
```

- URLs: `${BASE_URL}${API_ROUTES.PROMPTS}` con `PROMPTS = '/prompts'` **sin** barra final
  (el router declara `@router.get("")` sobre el prefijo; con barra FastAPI responde 307 y
  el redirect pierde el body del PUT — hereda el criterio de `ANALYSIS`), y
  `${BASE_URL}${API_ROUTES.PROMPTS}/${encodeURIComponent(agentName)}` para el `PUT`.
- `timeout: 15_000` ms en ambas llamadas (ver Decisión 4).
- `PUT` manda `{ system_prompt }` como JSON; axios pone el `Content-Type`.
- **Validación del payload**: `list` exige un array con al menos un elemento donde cada
  entrada tenga `agent_name` string no vacío y `system_prompt` string; `update` exige ese
  mismo shape sobre un objeto. Si no se cumple, se **lanza `Error`** con
  `'La respuesta del servidor no tiene el formato esperado.'` (hereda Decisión 2 de
  `hr-chat-redesign`: payload inválido es error, no UI vacía).
- **Errores HTTP**: `extractBackendError` sin cambios (ya entiende `detail` desde la
  feature 12). Fallback de `list`: `'No se pudieron cargar los prompts. Intentá de nuevo.'`;
  de `update`: `'No se pudo guardar el prompt. Intentá de nuevo.'`.

| Código | Causa | Qué ve el usuario |
|---|---|---|
| 404 | `agent_name` inexistente (no alcanzable desde esta UI) | `detail` del backend |
| 422 | `system_prompt` vacío (bloqueado antes en el cliente) | mensaje genérico (hereda Decisión 6 de `contract-analysis`) |
| 500 | error de escritura de `data/prompts.json` | `detail` del backend |
| — | red / timeout / CORS | mensaje genérico |

### Validaciones (cliente)

| Regla | Valor | Por qué |
|---|---|---|
| No vacío | `draft.trim() !== ''` | Espeja `min_length=1` del backend, que **no** rechaza `" "` |
| Largo máximo | ninguno | Ver Decisión 8 |
| Se envía | el texto **tal cual**, sin `trim` | Ver Decisión 9 |

Con el borrador en blanco, el botón de guardar queda deshabilitado y la región de estado de
esa card muestra `'El prompt no puede quedar vacío.'`.

### Estado (`usePromptsConfig`)

```ts
export type PromptsLoadStatus = 'loading' | 'ready' | 'error'
export type PromptSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface PromptEditor {
  agentName: string        // crudo, como lo devolvió el backend
  savedPrompt: string      // último valor confirmado por el backend (baseline)
  draft: string            // valor actual del textarea
  isDirty: boolean         // draft !== savedPrompt
  canSave: boolean         // isDirty && draft.trim() !== '' && status !== 'saving'
  status: PromptSaveStatus
  error: string | null
}

export interface UsePromptsConfigReturn {
  loadStatus: PromptsLoadStatus
  loadError: string | null
  editors: PromptEditor[]
  confirmingAgent: string | null               // qué card tiene el modal abierto
  changeDraft: (agentName: string, value: string) => void
  discardDraft: (agentName: string) => void    // draft ← savedPrompt
  requestSave: (agentName: string) => void     // abre el modal; no hace request
  confirmSave: () => void                      // cierra el modal y dispara el PUT
  cancelSave: () => void                       // cierra el modal, sin efectos
  reload: () => void
}
```

- `list()` se dispara una vez al montar; `reload()` vuelve a `loading` y reintenta.
- `editors` respeta el orden en que el backend devolvió los agentes (ver Decisión 7).
- **Flujo de guardado en dos pasos** (Decisión 11):
  - `requestSave(agentName)` con `canSave === false` no hace nada; si no, sólo setea
    `confirmingAgent = agentName`. Nunca dispara el request (hereda el criterio de `@s15` de
    `HrChat`: doble click no dispara dos requests).
  - `confirmSave()` no hace nada si `confirmingAgent === null` o si ese editor dejó de
    cumplir `canSave`. Si no: pone `confirmingAgent = null`, registra analytics y arranca el
    `PUT`. El modal se cierra al confirmar, no al resolverse el request (Decisión 23).
  - `cancelSave()` sólo pone `confirmingAgent = null`. No toca `draft`, `isDirty`, `status`
    ni `error` de ninguna card.
- `confirmingAgent` es uno solo: hay a lo sumo un modal abierto en la pantalla, y por eso el
  modal es una única instancia compartida y no uno por card (Decisión 22).
- Invariante: si `confirmingAgent !== null`, ese `agentName` existe en `editors`.
- Al terminar un `save` con éxito: `savedPrompt` y `draft` toman **el valor que devolvió el
  backend** (ver Decisión 10), `status: 'saved'`, `error: null`.
- Al fallar: `status: 'error'`, `error` con el mensaje; `draft` **no** se toca.
- `changeDraft` sobre una card en `'saved'` la devuelve a `'idle'`; sobre una en `'error'`
  **no** limpia el error (ver Decisión 13).
- Cada card tiene su propio `status` y su propio `error`. Guardar una no afecta a la otra.
- Invariantes: `'saved'` implica `isDirty === false`; `'error'` implica `error !== null`.

### Salidas (estructura de la pantalla)

`<main>` del shell contiene una **columna única** con scroll vertical y ancho máximo legible
(`max-w-4xl`), con:

1. `<h1>` "Configuración".
2. Bajada: "Editá los system prompts de los agentes que analizan los contratos."
3. Nota al pie del encabezado, en `text-xs text-on-surface-variant`: "Los cambios se aplican
   al próximo análisis. Guardar reemplaza el prompt anterior: el servidor no guarda historial."
4. Según `loadStatus`, una de tres ramas excluyentes:

| `loadStatus` | Contenido |
|---|---|
| `loading` | Spinner + "Cargando prompts…" |
| `error` | Bloque `bg-error-container text-on-error-container` con `loadError` y botón "Reintentar" (dispara `reload()`) |
| `ready` | Una card por entrada de `editors`, apiladas verticalmente con `gap` |

**Card de un agente**, de arriba abajo:

- **Encabezado**: `<h2>` con el label legible del agente, a su lado el `agent_name` crudo en
  `text-xs font-mono text-on-surface-variant`, y —solo si `isDirty`— un badge "Sin guardar"
  (`bg-secondary-container text-on-secondary-container`).
- **Descripción** en `text-on-surface-variant`: qué hace ese agente en el pipeline.
- **`<textarea>`**: `rows={14}`, `resize-y`, scroll interno, `font-mono text-sm`,
  `whitespace-pre-wrap` implícito. Asociado a un `<label htmlFor>` con texto
  `System prompt de <label>` oculto con `sr-only` — no `hidden` (hereda Decisión 15 de
  `contract-analysis`: queda accesible y localizable con `getByLabelText`). `readOnly`
  mientras `status === 'saving'` (ver Decisión 12).
- **Contador**: `<N> caracteres`, en `text-xs text-on-surface-variant`, referenciado desde el
  `aria-describedby` del textarea.
- **Pie de la card**, en una fila:
  - Izquierda — **región de estado** con `aria-live="polite"`, con contenido excluyente:
    `'El prompt no puede quedar vacío.'` / `'Cambios guardados.'` (icono `check_circle`,
    `text-primary`) / el `error` en bloque `bg-error-container text-on-error-container`.
    En `idle` sin borrador en blanco, la región está vacía.
  - Derecha — **"Descartar cambios"** (botón secundario, `outline`; solo se renderiza si
    `isDirty`; dispara `discardDraft`) y **"Guardar cambios"** (`bg-primary text-on-primary`,
    `disabled` cuando `canSave` es `false`; label "Guardando…" mientras `status === 'saving'`).
    "Guardar cambios" **abre el modal de confirmación**; no dispara el `PUT` (`requestSave`).

**Modal de confirmación** (`ConfirmSaveModal`) — se renderiza una única vez, después de las
cards, sólo cuando `confirmingAgent !== null`:

- **Backdrop**: overlay fijo a pantalla completa, `bg-black/50`. Un click sobre el backdrop
  —y sólo sobre él, no sobre el panel— dispara `cancelSave()`.
- **Panel**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` al título y
  `aria-describedby` al cuerpo. Superficie `bg-surface-container-low`, `rounded-xl`,
  ancho máximo `max-w-md`.
- **Título** (`<h2>`): "¿Sobrescribir el prompt?"
- **Cuerpo**: "Vas a reemplazar el system prompt de **&lt;label del agente&gt;**. El servidor no
  guarda historial: no vas a poder volver al texto anterior."
- **Botones**: **"Cancelar"** (secundario, dispara `cancelSave()`) y **"Sobrescribir"**
  (`bg-primary text-on-primary`, dispara `confirmSave()`). En ese orden, con "Sobrescribir"
  a la derecha.
- **Teclado y foco** (hechos a mano, ver Decisión 21):
  - Al montar, el foco va a **"Cancelar"** (Decisión 25).
  - `Escape` dispara `cancelSave()`.
  - `Tab`/`Shift+Tab` ciclan entre los dos únicos botones enfocables del panel.
  - Al desmontarse, el foco vuelve al elemento que lo tenía al abrirse — que es el botón
    "Guardar cambios" de la card que lo abrió.

Mientras el modal está abierto no cambia nada de la card de fondo: el textarea conserva su
borrador y su estado `isDirty` intacto.

**Labels y descripciones de agente** (`PromptsConfig.constants.ts`):

| `agent_name` | Label | Descripción |
|---|---|---|
| `contextualization_agent` | Agente de contextualización | "Primer paso: mapea la estructura de ambos documentos y hace corresponder cada cláusula del contrato con la de la enmienda." |
| `extraction_agent` | Agente de extracción | "Segundo paso: sobre ese mapa, identifica y describe los cambios concretos entre el contrato y su enmienda." |
| cualquier otro | `agent_name` con `_` → espacio y la primera letra en mayúscula | sin descripción |

### Tokens

No se agregan tokens ni utilities. Todos los usados (`primary`, `on-primary`,
`secondary-container`, `on-secondary-container`, `error-container`, `on-error-container`,
`surface-container-low`, `on-surface`, `on-surface-variant`, `outline`, `outline-variant`)
ya existen en `src/index.css`.

### Analytics

Se agrega `'prompt_saved'` a `EventName`, con payload
`{ agentName: string, promptLength: number }`. Se dispara en el `confirmSave()` efectivo,
antes del request — **no** al abrir el modal (hereda el criterio de `analytics`: el evento
registra la acción del usuario, no el resultado; abrir un modal que después se cancela no es
un guardado). Sin PII: se manda el largo, no el texto.

### Estructura de archivos

```
src/features/PromptsConfig/
├── components/
│   ├── PromptsConfigContainer/   ← único que conoce el hook y el service
│   ├── PromptList/               ← lee contexto, sin props; ramas loading/error/ready
│   ├── PromptCard/               ← presentacional, props-only, memo
│   ├── ConfirmSaveModal/         ← presentacional, props-only; una sola instancia
│   └── index.ts
├── context/{PromptsConfigContext.tsx, .types.ts, index.ts}
├── PromptsConfig.constants.ts    ← copys, labels y descripciones de agente
├── PromptsConfig.types.ts
└── index.ts
```

`SettingsPage.tsx` queda como composición:
`<PromptsConfigContainer><PromptList /></PromptsConfigContainer>`.

`PromptCard` recibe el `PromptEditor` desestructurado más `onChangeDraft`, `onDiscard` y
`onRequestSave`, todos con firma `(agentName: string, …) => void`: la card llama con su propio
`agentName` y los handlers del Container quedan estables, que es lo que hace que su `memo`
valga (`react-container-pattern`).

`PromptList` es quien lee `confirmingAgent` del contexto y renderiza el modal una sola vez,
después de las cards. `ConfirmSaveModal` no lee contexto — recibe todo por props:

```ts
export interface ConfirmSaveModalProps {
  agentLabel: string        // label legible, ya resuelto por PromptList
  onConfirm: () => void
  onCancel: () => void
}
```

No necesita `isSaving`: se desmonta al confirmar (Decisión 23).

### Tests

Archivos nuevos: `tests/PromptsConfig.test.tsx` (pantalla) y `tests/PromptsService.test.ts`
(service). `tests/DesignSystemShell.test.tsx` `@s2` se ajusta: hoy afirma "Próximamente" en
`/settings`. `tests/DocAgentService.test.ts` no debería requerir cambios — la extracción de
`getDocAgentBaseUrl()` mantiene la lectura de `import.meta.env` **dentro** de la función, no
en scope de módulo, para que los stubs existentes sigan funcionando.

**Restricción de entorno verificada — el modal no puede usar `<dialog>` nativo.** El proyecto
corre `jsdom@29.1.1`, donde `HTMLDialogElement` existe pero su prototipo sólo expone
`constructor` y `open`: **no hay `showModal()` ni `close()`** (comprobado ejecutando jsdom
contra un `<dialog>`; `typeof d.showModal === 'undefined'`). Un `<dialog>` + `showModal()`
lanzaría `TypeError` en cada test que abra el modal, y ni siquiera stubbeando el método jsdom
daría foco atrapado, `Escape` ni top-layer. De ahí la Decisión 21. `tests/setup.ts` **no**
necesita stub alguno con el enfoque elegido.

## Decisiones

1. **Las dos cards se muestran a la vez, apiladas en una columna; sin tabs ni selector.**
   Son exactamente 2 y cada borrador tiene estado propio. *Descartada:* tabs — esconden un
   borrador sin guardar detrás de una pestaña inactiva.

2. **Una card por agente con su propio botón de guardar; no hay "Guardar todo".**
   El backend solo expone `PUT` por agente. *Descartada:* un submit global — dos requests
   con semántica de fallo parcial que nadie pidió.

3. **`getDocAgentBaseUrl()` se extrae a un módulo propio que `docAgentService` también
   importa.** Un solo lugar define el fallback `http://localhost:8000`. *Descartada:*
   repetir el literal en el service nuevo — dos fuentes de verdad para el puerto.

4. **`timeout: 15_000` (no los 180 s de `analyze`).** Estos endpoints leen y escriben un
   JSON, no llaman a un LLM. *Descartada:* reusar 180 s — deja el spinner 3 minutos ante
   una conexión caída.

5. **La pantalla usa solo `GET /prompts`, no `GET /prompts/{agent}`.** El listado trae todo
   en una llamada. *Descartada:* una llamada por agente — N requests para el mismo dato.

6. **La UI renderiza los agentes que devuelve el backend; no hardcodea los dos nombres.**
   El backend es la fuente de verdad de qué agentes existen. *Descartada:* fijar los dos
   nombres en el cliente — un tercer agente quedaría invisible.

7. **Se respeta el orden del backend, no orden alfabético.** El JSON conserva el orden del
   pipeline (contextualización → extracción). *Descartada:* ordenar por nombre — coincide
   hoy por casualidad y ocultaría el orden real.

8. **Sin límite de caracteres en el cliente; sí contador visible.** El backend no impone
   máximo y un tope inventado bloquearía un prompt legítimo. *Descartada:* un máximo
   arbitrario — falso positivo sobre texto válido.

9. **Se envía el texto tal como se tipeó; el `trim` es solo para validar.** Recortar
   silenciosamente altera contenido que el usuario escribió. *Descartada:* mandar
   `draft.trim()` — muta la entrada sin avisar.

10. **Tras guardar, el baseline toma el `system_prompt` de la respuesta, no el borrador
    local.** El servidor es la fuente de verdad de lo persistido. *Descartada:* asumir el
    borrador — mostraría "sin cambios" sobre un estado no confirmado.

11. **Guardar pasa por un modal de confirmación** (resuelve PA-1, decidido por el humano).
    El `PUT` sobrescribe sin undo del servidor. *Descartada:* guardar directo apoyado sólo en
    el botón deshabilitado, el badge "Sin guardar" y "Descartar cambios".

12. **Durante el guardado el textarea queda `readOnly`, no `disabled`.** Evita que una
    edición en vuelo quede pisada por el baseline de la respuesta, y el texto sigue legible
    y seleccionable. *Descartada:* `disabled` — pierde el foco y apaga 2.000 caracteres.

13. **"Cambios guardados." desaparece al editar; el error de guardado no.** El éxito
    describe un estado que la edición invalida; el error describe un intento fallido que el
    usuario sigue queriendo ver mientras corrige. *Descartada:* limpiar ambos.

14. **Sin toast y sin timer de auto-dismiss: feedback inline por card.** Hereda Decisión 16
    de `hr-chat-redesign`. *Descartada:* toast con timeout — se pierde y agrega timers
    frágiles en los tests.

15. **Navegar fuera de `/settings` con cambios sin guardar los descarta sin advertencia.**
    `useBlocker` exige migrar a `createBrowserRouter` y `beforeunload` ni siquiera cubre la
    navegación del sidebar. *Descartada:* ambas — resuelven el caso equivocado.

16. **El error de guardado se reintenta con el mismo botón "Guardar cambios", que vuelve a
    abrir el modal.** La card sigue `isDirty` y la acción es idempotente. *Descartada:* un
    botón "Reintentar" aparte como en `/contracts` — dos controles para la misma acción.

17. **La nota del encabezado dice "el servidor no guarda historial", no habla de
    contenedores ni volúmenes.** Es la verdad relevante para el usuario e independiente del
    deploy. *Descartada:* advertir sobre volatilidad — además es falso hoy (ver §Nota de
    alcance).

18. **`PromptsConfig` se estructura como Container + presentacionales con contexto.**
    Hereda Decisión 22 de `contract-analysis`. *Descartada:* todo en `SettingsPage` —
    prop drilling y la página tocando el service.

19. **`promptsService.ts` aparte de `docAgentService.ts`, aun siendo el mismo backend.**
    El proyecto ya parte por dominio, no por host (`hrService` y `ragService` comparten
    backend). *Descartada:* un módulo por API — mezcla análisis con configuración.

20. **El service devuelve camelCase (`agentName`, `systemPrompt`).** Hereda Decisión 23 de
    `contract-analysis`. *Descartada:* pasar el payload crudo — acopla componentes al schema.

21. **El modal es un overlay propio con `role="dialog"`, no un `<dialog>` nativo.** El
    `jsdom@29.1.1` del proyecto no implementa `showModal()` (verificado). *Descartada:*
    `<dialog>` + `showModal()` — `TypeError` en todos los tests que lo abran.

22. **Una sola instancia del modal, gobernada por `confirmingAgent`, no una por card.** El
    estado "qué se está confirmando" es único en la pantalla. *Descartada:* un modal dentro de
    cada `PromptCard` — duplica markup y permite dos diálogos abiertos.

23. **Confirmar cierra el modal y arranca el `PUT`; el modal no espera la respuesta.** El
    loading, el éxito y el error ya tienen su lugar en la card. *Descartada:* mantenerlo
    abierto con spinner — duplicaría el render del error en dos superficies.

24. **Cancelar no toca nada: ni el borrador, ni `isDirty`, ni el `status` de la card.**
    Cancelar es "no hice nada", no "descartá". *Descartada:* que cancelar además revierta el
    borrador — confunde el modal con "Descartar cambios".

25. **Al abrirse, el foco va a "Cancelar", y el botón de confirmar dice "Sobrescribir".**
    La acción destructiva no debe quedar a un `Enter` de distancia, y el verbo nombra la
    consecuencia. *Descartada:* foco en el confirmar y label "Guardar" — invita al reflejo.

## Nota de alcance — restaurar el prompt por defecto (ex PA-2, confirmada fuera de alcance)

`DOC AGENT API/src/infrastructure/prompts/default_prompts.py` tiene los prompts originales,
pero **no hay endpoint que los restaure**: una vez que el `PUT` los pisa, el valor original
solo vive en el código del backend. Por eso el modal de confirmación (Decisión 11) es la única
barrera real antes de una sobrescritura.

- **Resuelto:** fuera de alcance. La UI no ofrece "Restaurar por defecto".
- **Por qué no se resuelve del lado del frontend:** hardcodear una copia de los dos prompts
  acá crea dos fuentes de verdad que se desincronizan al primer cambio en
  `default_prompts.py`. La función correcta es un `POST /prompts/{agent_name}/reset` en
  DOC AGENT API y una feature posterior en esta UI.
- **Dato verificado que corrige la premisa del brief:** los prompts **no** son volátiles hoy.
  `DOC AGENT API/docker-compose.yml` monta `./data:/app/data`, así que `data/prompts.json`
  persiste en el host y sobrevive a recrear el contenedor. Por eso la Decisión 17 no advierte
  sobre pérdida de datos. Si algún día se despliega sin ese bind mount, la nota del
  encabezado tendría que revisarse.

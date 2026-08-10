# hr-chat-redesign — spec

> Estado: **cerrada con 1 pregunta abierta** (ver §Preguntas abiertas). La pregunta
> abierta no bloquea la destilación: tiene comportamiento por defecto definido.
>
> Precedente: `specs/design-system-shell/spec.md` (feature 10, `done`). Los tokens,
> la tipografía, los iconos y las reglas de estilo se **heredan** de ahí; esta spec
> solo declara lo que agrega o cambia.

## Propósito

Rediseñar el chat de RR.HH. con el layout del mockup sobre el shell Tailwind/MD3, y arreglar el bug de integración que hoy hace que la respuesta del backend real llegue como `undefined`.

## Contrato

### Alcance

**Dentro:**

- `src/services/hrService.ts` — fix del shape de respuesta de `POST /api/query`.
- `src/hooks/useHrChat.ts` — `Exchange` pasa a llevar chunks y timestamp.
- `src/features/HrChat/` — migración completa de styled-components a Tailwind, con
  la estructura Container → lista → item (ver `react-container-pattern`).
- Panel de contexto lateral alimentado con los `chunks_related` reales.
- Panel de sugerencias que autocompletan el input.
- Dos tokens MD3 nuevos en `src/index.css` (`on-secondary-container`, `on-error-container`).
- `src/constants/apiRoutes.ts` (nuevo) con el endpoint de query.

**Fuera:**

- `RagPage` y `FaqPage` — siguen en styled-components; `GlobalStyles` sigue inyectándose
  (hereda Decisión 9 y 10 de `design-system-shell`).
- `ragService` y `/api/ingest` — el dominio obligatorio es la feature 14.
- Chips de acción bajo las respuestas del bot, adjuntar archivo, micrófono, auto-resize
  del textarea, `intent`/`reasoning`, persistencia del historial, responsive/mobile.

Consecuencia asumida: `src/features/HrChat/HrChat.styles.ts` se elimina y el escenario
`@s16` de `tests/HrChat.test.tsx` (SSR + `ServerStyleSheet`) se reescribe (ver §Tests).

### Entradas

- **Mockup de referencia** (fuente única del diseño, gitignoreado):
  `progress/mockups/design-system-shell/mockup-chatbot-ia.html`.
  Se implementa con los tokens de `src/index.css`, **no** con el Tailwind CDN ni los
  hex sueltos del HTML.
- **Backend**: `POST {VITE_API_BASE_URL}/api/query`, body `{ question: string }`.
- **Sugerencias**: constantes estáticas del feature (3 entradas, ver §Salidas).

### Contrato de `hrService.query` (el fix)

Respuesta real del backend (verificada en `RAG AGENT API/src/api/schemas.py`):

```jsonc
{
  "query_result": {
    "user_question": "…",
    "system_answer": "…",
    "chunks_related": [{ "content": "…", "source": "…", "similarity": 0.8734 }],
    "intent": "hr",
    "reasoning": "…"
  }
}
```

Firma nueva (rompe la actual `Promise<string>`):

```ts
export interface HrChunk {
  content: string
  source: string
  similarity: number
}

export interface HrAnswer {
  answer: string   // ← query_result.system_answer
  chunks: HrChunk[] // ← query_result.chunks_related (array vacío si no vino)
}

query(question: string): Promise<HrAnswer>
```

- `answer` sale de `query_result.system_answer`. Si no es un string no vacío,
  `query` **lanza `Error`** (el chat muestra el bubble de error, no una burbuja vacía).
- `chunks` sale de `query_result.chunks_related`; si falta o no es array → `[]`.
- `user_question`, `intent` y `reasoning` se descartan.
- El manejo de error 4xx/5xx **no cambia**: sigue usando `extractBackendError`
  (`{ error: string }`, confirmado en `RAG AGENT API/src/api/exception_handlers.py`).
- La URL se arma con `API_ROUTES.QUERY` desde `src/constants/apiRoutes.ts`.

### Estado (`useHrChat`)

```ts
export interface Exchange {
  question: string
  answer: string
  chunks: HrChunk[]
  askedAt: number    // Date.now() al enviar
  answeredAt: number // Date.now() al recibir
}
```

`isLoading`, `error`, `pendingQuestion`, `inputValue`, `submitQuestion`, `handleRetry`
conservan su semántica actual. Se agrega `setInputValue` como destino de las sugerencias.

**Chunks visibles en el panel** = los del último `Exchange` de la lista. Si no hay
ninguno, el panel muestra su estado vacío.

### Salidas (estructura de la pantalla)

`<main>` del shell contiene una fila: **columna de chat** (`flex-1`, scroll propio) +
**panel de contexto** (`w-80`, borde izquierdo, scroll propio). El panel se renderiza
siempre (hereda Decisión 20 de `design-system-shell`: mobile fuera de alcance).

**Columna de chat, de arriba abajo:**

1. **Saludo** — primera burbuja del asistente, persistente (no desaparece al enviar):
   avatar `smart_toy` sobre `bg-primary`, nombre "Asistente Mercurial", hora, y el texto
   "¡Hola! Soy el asistente de Mercurial. Puedo responder consultas sobre RR.HH.,
   tecnología y finanzas a partir de la base de conocimiento cargada. ¿En qué te ayudo?".
2. **Intercambios**, en orden. Por cada uno:
   - Burbuja de usuario alineada a la derecha: `bg-primary text-on-primary`,
     `rounded-2xl rounded-tr-sm`, avatar `person` sobre `bg-secondary-container
     text-on-secondary-container`, encabezado "Tú" + hora.
   - Burbuja del asistente alineada a la izquierda: `bg-surface-container-low
     text-on-surface`, `rounded-2xl rounded-tl-sm`, borde `outline-variant/10`,
     encabezado "Asistente Mercurial" + hora.
   - Ambas conservan `whitespace-pre-wrap` y `break-words` (las respuestas del backend
     traen saltos de línea).
3. **Pregunta en vuelo** (`pendingQuestion`) — misma burbuja de usuario.
4. **Indicador de carga** — texto "Mercurial está procesando tu consulta" + 3 puntos
   animados (se conserva la copia exacta, ya testeada).
5. **Bubble de error** — `bg-error-container text-on-error-container`, con el texto
   "No se pudo obtener respuesta. Intentá de nuevo." y botón "Reintentar".
6. **Área de input** — fila fija al pie de la columna (no superpuesta):
   textarea (`aria-label="Escribe tu pregunta"`, sin cambios; placeholder
   "Escribí tu consulta sobre RR.HH., tecnología o finanzas…") + botón "Enviar"
   con icono `send`, `bg-primary text-on-primary`. Debajo, en `text-xs`:
   "La IA puede cometer errores. Verificá la información con el área correspondiente."

**Formato de hora:** `toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })`
(24 h, p. ej. `09:05`).

**Panel de contexto (`w-80`), de arriba abajo:**

1. Encabezado "Contexto" + bajada.
2. **"Consultas sugeridas"** — 3 botones, uno por dominio del backend
   (`hr` / `tech` / `finance`), con icono, que al hacer clic **escriben la pregunta en el
   textarea, le dan foco y no envían**:

| # | Label | Icono | Texto que carga en el input |
|---|---|---|---|
| 1 | Política de vacaciones | `beach_access` | `¿Cómo funciona la política de vacaciones?` |
| 2 | Soporte técnico | `devices` | `¿Cómo pido soporte técnico o un equipo nuevo?` |
| 3 | Reintegro de gastos | `payments` | `¿Cómo se solicita un reintegro de gastos?` |

3. **"Fuentes de la respuesta"** — una tarjeta por chunk del último intercambio, en el
   orden en que las devolvió el backend:
   - `source` como título (truncado a una línea); si viene vacío → "Base de conocimiento".
   - `content` como cuerpo, recortado por CSS (`line-clamp-3`), sin truncado en JS.
   - `similarity` como porcentaje entero, clampeado a `[0, 100]`:
     `Math.round(Math.min(1, Math.max(0, similarity)) * 100)` → "87% de coincidencia".
   - Sin estado vacío: si el último intercambio no trajo chunks → "Esta respuesta no citó
     fragmentos de la base de conocimiento."
   - Si todavía no hubo ninguna respuesta → "Los fragmentos que respalden la respuesta
     aparecerán acá."

### Tokens nuevos en `src/index.css`

Cierran los pares que `design-system-shell` dejó pendientes (su Decisión final: "los pares
`on-*` se definirán cuando una feature los use"). Valores de la paleta MD3 base del mockup:

| Token | Light | Dark |
|---|---|---|
| `on-secondary-container` | `#2c1512` | `#ffdbd1` |
| `on-error-container` | `#410002` | `#ffdad6` |

### Analytics

Se agrega `'chat_suggestion_clicked'` a `EventName` en `src/services/analyticsService.ts`,
con payload `{ suggestion: string }`. `chat_message_sent` y `chat_retry_clicked` no cambian.

### Tests existentes: qué se preserva y qué se adapta

`tests/HrChat.test.tsx`

| Escenario | Destino |
|---|---|
| `@s2` foco al cargar, `@s3` Enter envía, `@s4` input limpio+deshabilitado, `@s5` indicador, `@s6` respuesta+indicador desaparece, `@s7` rehabilita y refocaliza, `@s8` Shift+Enter, `@s9`/`@s10` no envía vacío/espacios, `@s11`–`@s13` error+reintento, `@s14` scroll, `@s15` doble envío, `@s17` 501 chars, `@s19` bubble en vuelo | **Se preservan**. Solo cambia el mock de `hrService.query`, que ahora resuelve `{ answer, chunks }` en vez de un string. |
| `@s1` welcome centrado, `@s18` welcome desaparece al enviar | **Se reemplazan** por: el saludo del asistente está presente al cargar **y sigue presente** después de enviar (ver Decisión 12). |
| `@s16` overflow-wrap vía `ServerStyleSheet` | **Se reescribe** sin styled-components: la burbuja lleva las utilities `whitespace-pre-wrap` y `break-words`. Excepción consciente a "no testear implementación": es la única forma de blindar en jsdom que una respuesta larga no desborda. |

`tests/ApiIntegration.test.ts`

| Escenario | Destino |
|---|---|
| `@s1` POST con `{ question }`, `@s3`–`@s6` errores y base URL | **Se preservan**; los mocks de éxito pasan a devolver `{ data: { query_result: … } }`. |
| `@s2` "retorna el texto del campo `result`" | **Se reemplaza**: retorna `{ answer, chunks }` leídos de `query_result`. Se agregan los casos de payload inválido y `chunks_related` ausente. |
| ragService `@s7`–`@s15` | **Intactos**, no se tocan. |

`tests/DesignSystemShell.test.tsx` no se toca: el shell no cambia.

## Decisiones

1. **`hrService.query` devuelve un objeto `{ answer, chunks }`, no un string.** El panel
   necesita los chunks y el string ya no alcanza. *Descartada:* un segundo método
   `queryChunks` — duplicaría el request para una misma respuesta.

2. **Payload inválido = error, no burbuja vacía.** Si `system_answer` no es un string no
   vacío, `query` lanza. El bug que originó esta feature fue justamente renderizar
   `undefined`. *Descartada:* devolver `''` — el chat mentiría con una burbuja en blanco.

3. **`intent` y `reasoning` quedan fuera.** Son telemetría del orquestador, no la tarea del
   usuario, y las fuentes ya explican en qué se basó la respuesta. *Descartada:* un chip
   "¿por qué esta respuesta?" — superficie de UI nueva sin pedido.

4. **La sección del panel se llama "Fuentes de la respuesta", no "Documentos Activos".** Lo
   que llega son fragmentos de una respuesta, no documentos en proceso. *Descartada:* la
   copia del mockup — promete un estado de procesamiento inexistente.

5. **Una tarjeta por chunk, sin agrupar por `source`.** El chunk es la unidad de evidencia
   que el backend devuelve y que sostiene la respuesta. *Descartada:* agrupar por documento
   — esconde cuántos fragmentos respaldan realmente la respuesta.

6. **`similarity` se muestra en porcentaje clampeado a [0, 100].** Los scores de relevancia
   de Chroma pueden salirse del rango; "104% de coincidencia" parece un bug. *Descartada:*
   mostrar el float crudo — ruido sin significado para el usuario.

7. **Durante la carga, el panel conserva las fuentes del último intercambio.** Siguen siendo
   las de la última respuesta real que el usuario está leyendo. *Descartada:* vaciarlo al
   enviar — parpadeo y pérdida de contexto mientras se espera.

8. **El panel se renderiza siempre, sin breakpoint.** Hereda Decisión 20 de
   `specs/design-system-shell/spec.md` (mobile fuera de alcance). *Descartada:* el
   `hidden lg:flex` del mockup — decide responsive sin haberlo diseñado.

9. **"Acciones Rápidas" sobrevive como sugerencias que autocompletan el input y le dan
   foco, sin enviar.** Tiene efecto real y resuelve el "no sé qué preguntar" del estado
   vacío. *Descartada:* auto-enviar — dispara un request por un clic accidental.

10. **Las 3 sugerencias cubren un dominio del backend cada una (`hr`, `tech`, `finance`).**
    Comunican el alcance real del RAG. *Descartada:* las tres etiquetas HR del mockup —
    ocultan dos de los tres dominios que la API ya resuelve.

11. **Se agrega el evento `chat_suggestion_clicked`.** Los shortcuts son UI nueva de valor
    no probado; sin métrica no hay forma de saber si se ganan el espacio. *Descartada:*
    apoyarse solo en `chat_message_sent` — no distingue sugerencia de tipeo.

12. **El saludo es la primera burbuja del asistente y es persistente.** Es el patrón del
    mockup y da contexto de capacidades durante toda la sesión. *Descartada:* mantener el
    welcome centrado que desaparece al enviar (`@s1`/`@s18`) — no existe en el rediseño.

13. **Las horas salen del reloj del cliente al crear cada mensaje, en formato 24 h es-AR.**
    Son dato real, no decoración. *Descartada:* copiar los "09:00 AM" del mockup — sería
    contenido falso, y el locale de la app es rioplatense.

14. **Los chips bajo las respuestas del bot ("Generar borrador", "Ver documento original")
    quedan fuera.** Hereda Decisión 12 de `design-system-shell`: un botón sin handler es UI
    muerta. *Descartada:* incluirlos deshabilitados — prometen función inexistente.

15. **Adjuntar archivo y micrófono quedan fuera.** `POST /api/query` solo acepta
    `{ question: string }`; no hay adjunto ni voz que enviar. Hereda Decisión 12.
    *Descartada:* adjuntar que redirija a `/rag` — dos flujos distintos bajo un mismo icono.

16. **El bubble de error inline con "Reintentar" se conserva, solo se retematiza.** Es
    comportamiento de una feature cerrada y ata el error a la pregunta que falló.
    *Descartada:* toast — hereda el criterio de Decisión 19 de `design-system-shell`.

17. **Se definen `on-secondary-container` y `on-error-container` con la paleta MD3 base.**
    Los usa el avatar de usuario y el bubble de error. *Descartada:* hex inline — rompe el
    contrato de tokens de la feature 10.

18. **Se usan los tokens, no los hex sueltos del mockup** (p. ej. el `#e5c07b` del botón
    Enviar → `bg-primary`). *Descartada:* respetar el hex — queda fuera del sistema y no
    responde al cambio de tema.

19. **Sin auto-resize del textarea; altura fija con scroll interno.** El auto-resize del
    mockup depende de `scrollHeight`, que en jsdom siempre es 0: quedaría sin test que lo
    muerda. *Descartada:* el script del mockup — comportamiento no verificable.

20. **El área de input es una fila fija de la columna, sin overlay ni gradiente.** Evita
    posicionamiento absoluto y un token `surface-container-lowest` extra. *Descartada:* el
    `absolute` + degradado del mockup — más superficie por un efecto decorativo.

21. **`HrChat` se estructura como Container + subcomponentes presentacionales**
    (`react-container-pattern`): el Container consume `useHrChat` y provee contexto; la
    lista y el panel lo leen. *Descartada:* un único componente — prop drilling a 3 niveles.

22. **El `aria-label` del textarea sigue siendo "Escribe tu pregunta".** Cambiarlo rompería
    tests verdes sin ganancia funcional. *Descartada:* alinearlo al voseo del resto de la
    copia — churn de tests por estética.

23. **El endpoint se muda a `src/constants/apiRoutes.ts`.** Lo exige `conventions.md` del
    perfil y ya estamos reescribiendo el service. *Descartada:* migrar también `ragService`
    — es de la feature 14 y ampliaría el diff sin necesidad.

## Preguntas abiertas

**PREGUNTA ABIERTA — el `source` de los documentos cargados desde la UI es literalmente
`"api"`.** `RAG AGENT API/src/services/indexer.py` indexa todo lo que entra por
`POST /api/ingest` con `source="api"` y `title="document-{i}"`; el nombre del archivo
original se pierde. Consecuencia: para el conocimiento cargado desde `/rag`, cada tarjeta
del panel se titula "api", que se lee como un bug aunque sea el dato real.

- **Comportamiento por defecto para no bloquear la destilación:** se muestra el `source`
  tal cual llega (fallback "Base de conocimiento" solo si viene vacío). El fragmento y el
  porcentaje de coincidencia siguen siendo informativos aunque el título no lo sea.
- **Opciones para el humano:** (a) dejarlo así; (b) mapear el literal `"api"` a una etiqueta
  amable en el front — funciona ya, pero mete una constante mágica del backend en la UI;
  (c) arreglarlo en el backend para que `/api/ingest` propague el nombre de archivo — es la
  solución correcta, pero es trabajo de otro repo y probablemente de la feature 14, que ya
  toca ese endpoint.

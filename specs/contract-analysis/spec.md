# contract-analysis — spec

> Estado: **cerrada con 3 preguntas abiertas** (ver §Preguntas abiertas). Ninguna
> bloquea la destilación: las tres tienen comportamiento por defecto definido.
>
> Precedentes: `specs/design-system-shell/spec.md` (feature 10, `done`) y
> `specs/hr-chat-redesign/spec.md` (feature 11, `done`). Tokens, tipografía, iconos,
> patrón Container y manejo de error inline se **heredan** de ahí; esta spec solo
> declara lo que agrega o cambia.

## Propósito

Reemplazar el placeholder de `/contracts` por la pantalla real que sube un contrato
original y su enmienda a `POST /analysis` de DOC AGENT API y muestra los cambios detectados.

## Contrato

### Alcance

**Dentro:**

- `src/services/docAgentService.ts` (nuevo) — cliente de `POST /analysis`.
- `src/services/httpError.ts` — `extractBackendError` pasa a entender también `detail`.
- `src/hooks/useContractAnalysis.ts` (nuevo) — estado de los dos archivos y del análisis.
- `src/features/ContractAnalysis/` (nuevo) — Container + presentacionales.
- `src/pages/ContractsPage.tsx` — deja de ser placeholder y monta el Container.
- `src/constants/apiRoutes.ts` — se agrega `ANALYSIS`.
- `src/utils/formatFileSize.ts` (nuevo) — se muda la función homónima de `useRagForm.ts`.
- `src/services/analyticsService.ts` — un `EventName` nuevo.
- `README.md` — documentación de las dos variables de entorno.
- **Rename `VITE_API_BASE_URL` → `VITE_RAG_API_BASE_URL`** (confirmado con el humano):
  `src/services/hrService.ts`, `src/services/ragService.ts`, `.env.local`, y cualquier
  test que mockee `import.meta.env.VITE_API_BASE_URL` (ver Decisión 25). Sin cambio de
  comportamiento — es un rename, no requiere escenario Gherkin propio.

**Fuera:**

- `HrChat`, `RagPage`, `FaqPage`, `SettingsPage` y el shell: no se tocan.
- El endpoint `GET/PUT /prompts` de DOC AGENT API — es la feature 13.
- Historial de análisis, exportación del resultado, comparación de más de dos imágenes,
  PDF/DOCX/TXT, responsive/mobile (hereda Decisión 20 de `design-system-shell`).
- CORS en DOC AGENT API: es cambio de otro repo (ver §Preguntas abiertas, PA-1).

### Entradas

- **Mockup de referencia** (fuente única del diseño, gitignoreado):
  `progress/mockups/design-system-shell/mockup-analizador-contratos.html`.
  Se implementa con los tokens de `src/index.css`, **no** con el Tailwind CDN ni los hex
  del HTML. El mockup está bajo la carpeta de la feature 10 porque nació con ella; esa es
  la ruta real y es la que vale.
- **Backend**: `POST {VITE_DOC_AGENT_API_BASE_URL}/analysis`, `multipart/form-data`,
  campos `original_image` y `amendment_image`, **ambos requeridos**
  (verificado en `DOC AGENT API/src/api/analysis.py`: `File(...)` sin default).
- **Archivos**: dos, elegidos por el usuario vía input nativo o drag & drop.

### Variable de entorno

`VITE_DOC_AGENT_API_BASE_URL`, con fallback en código a `http://localhost:8000`.
Es independiente de `VITE_API_BASE_URL` (RAG AGENT API), que no se toca.

### Contrato de `docAgentService.analyze`

Respuesta real del backend (verificada en `DOC AGENT API/src/models.py`, `ContractChangeOutput`):

```jsonc
{
  "sections_changed": ["Cláusula 4.2 - Plazo"],   // min 1
  "topics_touched": ["Monto"],                     // min 1
  "summary_of_the_change": "…"                     // min 1 char
}
```

Firma:

```ts
export interface ContractAnalysis {
  sectionsChanged: string[]
  topicsTouched: string[]
  summary: string
}

analyze(original: File, amendment: File): Promise<ContractAnalysis>
```

- Arma un `FormData` con `original_image` y `amendment_image`. **No** se setea
  `Content-Type` a mano: axios agrega el `boundary`.
- `timeout: 180_000` ms.
- URL: `${BASE_URL}${API_ROUTES.ANALYSIS}` con `ANALYSIS = '/analysis'`, **sin** barra
  final (FastAPI responde 307 a `/analysis/` y el redirect pierde el body del POST).
- **Validación del payload**: `summary_of_the_change` debe ser string no vacío y
  `sections_changed`/`topics_touched` arrays con al menos un string no vacío (se filtran
  las entradas que no sean string). Si no se cumple, `analyze` **lanza `Error`**
  (hereda Decisión 2 de `hr-chat-redesign`: payload inválido es error, no UI vacía).
- **Errores HTTP**: `extractBackendError` (ver abajo). Si no hay mensaje del backend, el
  mensaje es `'No se pudieron analizar los documentos. Intentá de nuevo.'`.

Códigos que devuelve el backend, todos con body `{ "detail": string }`:

| Código | Causa | Qué ve el usuario |
|---|---|---|
| 400 | imagen inválida (no existe / formato no soportado) | `detail` del backend |
| 500 | falta env var en el server (`OPENAI_API_KEY`, Langfuse) | `detail` del backend |
| 502 | falló GPT-4o Vision o el agente de extracción | `detail` del backend |
| — | red / timeout / CORS | mensaje genérico |

### Cambio en `extractBackendError`

Hoy solo lee `response.data.error` (shape del RAG AGENT API, `exception_handlers.py`).
DOC AGENT API usa el `{ "detail": … }` de FastAPI. Contrato nuevo, en orden:

1. `response.data.error` si es string no vacío → devolverlo.
2. `response.data.detail` si es string no vacío → devolverlo.
3. En cualquier otro caso → `null`.

El paso 3 cubre explícitamente el 422 de FastAPI, donde `detail` es un **array** de
objetos de validación: no es texto para mostrar, así que cae al mensaje genérico.
Los dos shapes no colisionan: el RAG nunca manda `detail`, el DOC nunca manda `error`.

### Validaciones de archivo (cliente)

Se aplican al seleccionar, antes de enviar, por archivo y de forma independiente:

| Regla | Valor | Por qué |
|---|---|---|
| Extensión | `.png`, `.jpg`, `.jpeg` (case-insensitive) | Espeja `VALID_EXTENSIONS` de `image_parser.py`, que valida por **sufijo del nombre**, no por MIME |
| Tamaño máximo | `MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024` | Ver PA-3 |
| Cantidad | exactamente 1 por dropzone | El endpoint recibe dos archivos, uno por campo |

- El `<input>` lleva `accept=".png,.jpg,.jpeg"`, pero la validación **no** confía en el
  `accept` (no aplica a drag & drop).
- Archivo rechazado: no se carga, no reemplaza al que ya estaba, y muestra error inline
  en su propia dropzone (`'Formato no soportado. Subí una imagen .png, .jpg o .jpeg.'` /
  `'La imagen supera el límite de 10 MB.'`).
- El error inline de una dropzone se limpia cuando esa dropzone acepta un archivo válido.

### Estado (`useContractAnalysis`)

```ts
export type ContractAnalysisStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseContractAnalysisReturn {
  originalFile: File | null
  amendmentFile: File | null
  originalError: string | null      // error de validación de esa dropzone
  amendmentError: string | null
  status: ContractAnalysisStatus
  result: ContractAnalysis | null
  error: string | null              // error del análisis (backend o red)
  canSubmit: boolean                // ambos archivos válidos && status !== 'loading'
  selectOriginal: (file: File) => void
  selectAmendment: (file: File) => void
  removeOriginal: () => void
  removeAmendment: () => void
  submit: () => void
  retry: () => void                 // reenvía los mismos dos archivos
}
```

- `submit()` con `canSubmit === false` no hace nada (hereda el criterio de `@s15` de
  `HrChat`: doble envío no dispara dos requests).
- Al arrancar un análisis, `result` y `error` anteriores se descartan.
- Quitar o reemplazar un archivo **no** borra el `result` en pantalla: recién se descarta
  al enviar el análisis siguiente (ver Decisión 9).
- `status: 'success'` con `result !== null` es invariante; `'error'` con `error !== null`
  también.

### Salidas (estructura de la pantalla)

`<main>` del shell contiene un `<h1>` "Analizador de Contratos" con bajada
"Compará un contrato con su enmienda y obtené los cambios detectados." y, debajo, una fila
de **dos columnas de igual ancho** con `gap`, cada una con scroll propio. Se renderizan
siempre, sin breakpoint (hereda Decisión 8 de `hr-chat-redesign`).

**Columna izquierda — carga (de arriba abajo):**

1. **Card "Contrato original"** — icono `description` sobre `bg-primary-container`,
   badge "Requerido".
2. **Card "Enmienda"** — icono `compare_arrows` sobre `bg-secondary-container`,
   badge "Requerido".
3. **Botón "Analizar documentos"** — icono `auto_awesome`, `bg-primary text-on-primary`,
   `disabled` mientras `canSubmit` sea `false`. Durante `loading` el label pasa a
   "Analizando…".

**Cada card contiene una dropzone**, con dos estados excluyentes:

| Estado | Contenido |
|---|---|
| Vacía | Borde punteado (`border-dashed border-outline-variant`), icono `upload_file`, texto "Arrastrá la imagen acá o hacé clic para seleccionar" y hint "PNG o JPG (máx. 10 MB)". `<input type="file">` asociado por `<label htmlFor>` y oculto con `sr-only` (no `hidden`) |
| Con archivo | Fila con icono `image`, nombre truncado a una línea, tamaño vía `formatFileSize`, y botón de quitar (`close`, `aria-label="Quitar <nombre>"`) |

Durante `dragover` la dropzone resalta el borde (`border-primary`) y lo revierte en
`dragleave`/`drop` — mismo comportamiento ya testeado en `rag-form-v2`.

**Columna derecha — panel de estado.** Una sola región con `aria-live="polite"` y cuatro
estados excluyentes según `status`:

1. **`idle`** — icono `neurology`, título "Inteligencia analítica", bajada
   "Transcribimos las dos imágenes y comparamos el texto para detectar qué cambió entre el
   contrato y su enmienda.", y dos pasos numerados:
   `01 Transcripción de las imágenes` — "Se lee el texto de cada contrato preservando su
   numeración de cláusulas."; `02 Detección de cambios` — "Se comparan ambos textos y se
   listan las secciones y los temas afectados."
2. **`loading`** — spinner, "Analizando documentos…" y la nota "Puede tardar hasta un
   minuto: se transcriben las dos imágenes y después se comparan." Sin barra de progreso.
3. **`error`** — bloque `bg-error-container text-on-error-container` con el mensaje y
   botón "Reintentar" (dispara `retry()`).
4. **`success`** — "Resultado del análisis", y en este orden:
   - **Resumen del cambio** — `summary`, con `whitespace-pre-wrap` y `break-words`.
   - **Secciones modificadas** — `<ul>`, un ítem por entrada de `sectionsChanged`, en el
     orden que las devolvió el backend.
   - **Temas afectados** — chips (`bg-secondary-container text-on-secondary-container`),
     uno por entrada de `topicsTouched`, en orden.
   - Pie en `text-xs`: "Generado por IA. Verificá el resultado contra los documentos
     originales."

   Los tres campos vienen garantizados no vacíos por el contrato del backend y por la
   validación del service, así que no hay estado vacío dentro de `success`.

### Tokens

No se agregan tokens. El mockup usa dos clases que **no existen** en `src/index.css` y se
reemplazan: `bg-surface-variant` → `bg-surface-container-high`;
`hover:bg-surface-tint` → `hover:bg-primary/90`.

### Analytics

Se agrega `'contract_analysis_submitted'` a `EventName`, con payload
`{ originalSizeBytes: number, amendmentSizeBytes: number }`. Se dispara en `submit()`
efectivo (no en los rechazados por `canSubmit`).

### Estructura de archivos

```
src/features/ContractAnalysis/
├── components/
│   ├── ContractAnalysisContainer/   ← único que conoce el hook y el service
│   ├── UploadColumn/                ← lee contexto, sin props
│   ├── FileDropzone/                ← presentacional, props-only, memo
│   ├── ResultPanel/                 ← lee contexto, sin props
│   └── index.ts
├── context/{ContractAnalysisContext.tsx, .types.ts, index.ts}
├── ContractAnalysis.constants.ts    ← copys, límites, extensiones
├── ContractAnalysis.types.ts
└── index.ts
```

`ContractsPage.tsx` queda como composición: `<ContractAnalysisContainer><UploadColumn/><ResultPanel/></ContractAnalysisContainer>`.

### Tests

Archivos nuevos: `tests/ContractAnalysis.test.tsx` (pantalla) y
`tests/DocAgentService.test.ts` (service + `extractBackendError`).
`tests/ApiIntegration.test.ts` **solo** se amplía si hace falta cubrir la regresión de
`extractBackendError` con el shape `{ error }` del RAG; el resto de sus escenarios no se toca.
`tests/DesignSystemShell.test.tsx` puede requerir ajuste si asserta el texto "Próximamente"
de `/contracts`.

## Decisiones

1. **Los dos archivos son requeridos; el badge "Opcional" del mockup se corrige.**
   `POST /analysis` declara ambos con `File(...)` sin default. *Descartada:* respetar el
   mockup — el usuario llegaría al submit y el backend devolvería 422.

2. **Solo imágenes `.png`/`.jpg`/`.jpeg`; se corrige el "PDF, DOCX, TXT" del mockup.**
   El pipeline transcribe con GPT-4o Vision y valida por extensión. *Descartada:* aceptar
   todo y dejar que falle el backend — gasta una llamada y confunde.

3. **La validación de extensión es por nombre de archivo, no por `file.type`.**
   `image_parser.py` valida el sufijo; un `.webp` con MIME `image/png` pasaría el filtro
   MIME y rompería en el server. *Descartada:* validar por MIME — no espeja al backend.

4. **Base URL propia en `VITE_DOC_AGENT_API_BASE_URL`.** Son dos backends distintos, en
   puertos distintos, con contratos de error distintos. *Descartada:* reusar
   `VITE_API_BASE_URL` — ataría las dos APIs al mismo host para siempre.

5. **`extractBackendError` se extiende con el caso `detail`, no se duplica.** Un solo punto
   de traducción de errores HTTP para toda la app, y los shapes no colisionan.
   *Descartada:* un `extractDetailError` aparte — dos funciones que hacen lo mismo.

6. **El 422 de FastAPI (con `detail` array) cae al mensaje genérico.** Es un objeto de
   validación de Pydantic, no texto para un usuario. *Descartada:* serializarlo con
   `JSON.stringify` — vuelca ruido de framework en la UI.

7. **Indicador de carga simple, sin barra de progreso ni pasos animados.** El backend no
   expone progreso: es una llamada síncrona. *Descartada:* el progreso simulado del mockup
   — inventa un avance que no existe y miente sobre el estado real.

8. **Se declara la espera esperable ("puede tardar hasta un minuto") en vez de simularla.**
   Son 2 llamadas a GPT-4o Vision más 2 agentes secuenciales. *Descartada:* solo un
   spinner mudo — a los 40 s el usuario asume que se colgó.

9. **Tras un análisis exitoso el resultado queda en pantalla y los archivos se conservan.**
   El caso real es cambiar solo la enmienda y volver a analizar contra el mismo original.
   *Descartada:* resetear el formulario — obliga a re-subir el contrato base.

10. **Sin historial de análisis.** Hereda el criterio de Decisión 7 de
    `design-system-shell` (el item "Historial" está fuera de alcance) y no hay endpoint que
    lo persista. *Descartada:* historial en memoria — se pierde al recargar.

11. **Layout de dos columnas iguales: carga a la izquierda, estado/resultado a la derecha.**
    El resultado ocupa el mismo panel que el texto informativo del `idle`. *Descartada:*
    resultado debajo del formulario — empuja el contenido fuera de vista al terminar.

12. **El panel `idle` describe lo que el sistema hace de verdad (transcribir y comparar).**
    *Descartada:* el "identifica riesgos ocultos / cláusulas abusivas" del mockup — promete
    un análisis de riesgo que el pipeline no hace.

13. **El resumen va primero y las listas después.** `summary_of_the_change` es la respuesta
    a "qué cambió"; las secciones y los temas son el detalle que la respalda.
    *Descartada:* el orden del schema — pone dos listas de etiquetas antes de la respuesta.

14. **Las cards se llaman "Contrato original" y "Enmienda".** Espeja `original_image` /
    `amendment_image` y la dirección de la comparación. *Descartada:* "Contrato Base" y
    "Contrato a Comparar" del mockup — no dicen cuál es la versión nueva.

15. **El `<input type="file">` se oculta con `sr-only` y se asocia con `<label htmlFor>`.**
    Queda accesible por teclado y localizable con `getByLabelText`. *Descartada:* el
    `class="hidden"` + `input.click()` del mockup — saca el control del orden de foco.

16. **Drag & drop se implementa, además del click.** Es comportamiento ya especificado y
    testeado en `rag-form-v2`, y la copia de la dropzone lo promete. *Descartada:* solo
    click — obligaría a reescribir la copia y perdería paridad con `/rag`.

17. **Errores de validación inline por dropzone, no un resumen arriba.** Cada mensaje queda
    al lado del control que lo causó. Hereda Decisión 16 de `hr-chat-redesign` (inline, no
    toast). *Descartada:* un banner único — no dice cuál de los dos archivos falló.

18. **`formatFileSize` se muda a `src/utils/formatFileSize.ts` y `useRagForm.ts` la importa
    desde ahí.** Un util compartido no vive dentro de un hook de otra feature.
    *Descartada:* importarla desde `useRagForm` — acopla `/contracts` a `/rag`.

19. **`timeout: 180_000` en el request.** Sin timeout, una conexión caída deja el spinner
    para siempre; 3 min cubren dos llamadas de visión más dos agentes. *Descartada:* el
    default de axios (sin timeout) — estado de carga irrecuperable.

20. **No se setea `Content-Type` a mano en el `FormData`.** Escribir
    `'multipart/form-data'` sin `boundary` hace que FastAPI no parsee los campos.
    *Descartada:* declararlo explícitamente — rompe el request.

21. **Un solo evento nuevo: `contract_analysis_submitted`.** Mide el uso real de la
    pantalla, que es lo que hoy no sabemos. *Descartada:* sumar
    `contract_files_selected` a la par de `rag_files_selected` — no hay pregunta de
    producto sobre el drop-off entre elegir y enviar.

22. **`ContractAnalysis` se estructura como Container + presentacionales con contexto.**
    Hereda Decisión 21 de `hr-chat-redesign` y `react-container-pattern`: el Container es
    el único que toca el service. *Descartada:* todo en `ContractsPage` — prop drilling.

23. **El service devuelve camelCase (`sectionsChanged`, `topicsTouched`, `summary`).**
    Hereda el criterio de `hrService` (`answer`/`chunks`): el snake_case del backend no
    se filtra a la UI. *Descartada:* pasar el payload crudo — acopla componentes al schema.

24. **Las dos variables de entorno se documentan en `README.md`.** Hoy ninguna está
    escrita en el repo y con dos backends distintos la confusión de puertos es inevitable
    (ver PA-2). *Descartada:* dejarlo solo en `.env.local`, que está gitignoreado.

## Preguntas abiertas

### PA-1 — DOC AGENT API no tiene CORS habilitado. Hoy la pantalla no puede funcionar en el navegador.

`DOC AGENT API/src/api/app.py` no registra `CORSMiddleware` (verificado por grep en los dos
repos: `RAG AGENT API` tampoco lo tiene). Un `POST` con `FormData` es una *simple request*,
así que **sí sale** hacia el backend, el análisis corre y gasta tokens de OpenAI — pero el
navegador bloquea la lectura de la respuesta por falta de `Access-Control-Allow-Origin`.
El usuario ve un error de red genérico después de haber pagado la llamada.

- **Comportamiento por defecto para no bloquear la destilación:** la spec no depende de la
  solución elegida. `docAgentService` arma la URL como `${BASE_URL}${ANALYSIS}`, y eso
  funciona igual si `BASE_URL` es absoluta (`http://localhost:8000`) o relativa
  (`''` o `/doc-api` detrás de un proxy). El fallo por CORS entra por la rama de error de
  red y muestra el mensaje genérico.
- **Opciones para el humano:**
  (a) agregar `CORSMiddleware` a DOC AGENT API — 4 líneas, es la solución correcta, pero
  es trabajo de otro repo y deja al RAG AGENT API con el mismo problema;
  (b) `server.proxy` en `vite.config.ts` apuntando `/doc-api` → `http://localhost:8000`,
  con `VITE_DOC_AGENT_API_BASE_URL=/doc-api`: cero cambios de backend, mismo-origen, pero
  solo aplica a `npm run dev` (que hoy es la única forma en que corre la app);
  (c) dejarlo como está y verificar la pantalla solo con tests.

### PA-2 — Colisión de puertos entre los dos backends.

`DOC AGENT API/docker-compose.yml` publica `8000:8000`. `RAG AGENT API/docker-compose.yml`
publica `8080:8000`. Pero `.env.local` de esta UI tiene
`VITE_API_BASE_URL=http://localhost:8000`, que apunta al DOC, no al RAG.

- **Comportamiento por defecto:** `VITE_DOC_AGENT_API_BASE_URL` cae a
  `http://localhost:8000` (el puerto que publica su compose). Esta feature **no** modifica
  `.env.local` ni `VITE_API_BASE_URL`.
- **Para el humano:** confirmar en qué puerto corre cada backend en tu entorno y, si el RAG
  efectivamente está en 8080, corregir `VITE_API_BASE_URL` a `http://localhost:8080` — si
  no, el chat de la feature 11 le está pegando al DOC AGENT API.

### PA-3 — Límite de tamaño por imagen.

El backend no documenta ni valida tamaño; es una decisión de UX del cliente (precedente:
`rag-form-v2` fijó 2 MB por `.txt`).

- **Comportamiento por defecto:** 10 MB por imagen. Una foto de contrato de celular pesa
  3-8 MB, y el base64 que arma `image_parser.py` infla ~33 % el payload que va a OpenAI.
- **Para el humano:** si preferís otro número (5 MB es más conservador, 20 MB copia el
  texto del mockup), decilo antes de la destilación — el valor aparece en la copia de la
  dropzone y en al menos dos escenarios Gherkin.

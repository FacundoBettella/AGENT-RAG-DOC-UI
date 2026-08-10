# project-spec.md — Mercurial

> Especificación conversada con el humano. Cada sección nace del debate
> entre Facundo y el `analyst`. El `bdd-writer` destila los
> `.feature` desde aquí.

## Propósito del proyecto

**Mercurial** es una interfaz web para que empleados realicen consultas de
Recursos Humanos a un backend Python local. El sistema responde preguntas
sobre políticas, beneficios, licencias y procedimientos de RR.HH.

## Decisiones globales

- **React 18 + TypeScript strict.** Sin excepciones a `strict: true`.
- **Vite** como bundler/dev-server.
- **styled-components** como única librería de UI. Sin Tailwind, sin MUI,
  sin Chakra ni similares.
- **@testing-library/react (RTL) + Vitest.** Tests centrados en
  comportamiento observable. Sin snapshots de implementación.
- **Sin historial de contexto para la API.** Cada pregunta se envía
  de forma independiente. El historial es solo visual (sesión del navegador).
- **Arquitectura en capas:** `services/` → `hooks/` → `components/` →
  `features/` → `pages/`. Un componente nunca llama a `fetch` directamente.

## Diseño — Sistema de tokens Zelda (sobrio)

Paleta acordada: inspiración en The Legend of Zelda (parchment, forest,
gold), aplicada con sobriedad a un sistema interno corporativo.

| Token                  | Valor      | Uso                              |
|------------------------|------------|----------------------------------|
| `--color-bg`           | `#0f1a0f`  | Fondo global (verde noche)       |
| `--color-surface`      | `#1a2b1a`  | Superficie de tarjetas/chat      |
| `--color-surface-alt`  | `#243524`  | Bubble de pregunta del usuario   |
| `--color-gold`         | `#c9a84c`  | Acento principal (Triforce gold) |
| `--color-gold-bright`  | `#f0c040`  | Hover, foco, CTA                 |
| `--color-text-primary` | `#ede0c4`  | Texto principal (parchment)      |
| `--color-text-muted`   | `#9e9a85`  | Texto secundario, placeholders   |
| `--color-border`       | `#2e4a2e`  | Bordes de tarjetas e inputs      |
| `--color-error`        | `#8b2635`  | Error inline                     |
| `--color-error-text`   | `#f4a0a8`  | Texto de error                   |

Tipografía:
- Body: `'Georgia', serif` — evoca los diálogos de Zelda sin ser ilegible.
- Monospace/UI labels: `'Courier New', monospace` — solo en timestamps y
  etiquetas técnicas.
- Tamaño base: `16px`. Escala modular × 1.25.

Estética general: borders `1px solid var(--color-border)`, `border-radius`
entre `4px` y `8px`, sin sombras exageradas. Sin gradientes llamativos.
El sistema debe sentirse como un terminal de piedra con incrustaciones de oro.

---

## Feature: app-shell

### Propósito

Estructura visual global de la app: header con branding Mercurial y área
principal donde se monta el chat.

### Comportamiento

- El header muestra el nombre **"Mercurial"** en grande y el subtítulo
  *"Consultas de Recursos Humanos"* debajo, en dorado (`--color-gold`).
- El layout ocupa `100dvh`. El header es fijo en la parte superior.
  El área de chat ocupa el espacio restante.
- Los estilos globales (tokens CSS, reset, fuentes) se inyectan aquí.

### Contrato

- Entrada: ninguna (es el punto de montaje).
- Salida: árbol React con `<header>` + `<main>` donde se monta `HrChat`.

### Casos límite

- Sin estado de error ni loading propio: es solo estructura.
- Si el viewport es muy pequeño (< 320px), el layout no debe romperse.

### Decisiones

- **Una sola página sin React Router.** La app no tiene rutas adicionales
  hoy. *Alternativa descartada:* React Router desde el inicio — overhead
  innecesario para un MVP de una pantalla.
- **`100dvh` en lugar de `100vh`.** Los navegadores mobile recortan `vh`
  con la barra de URL visible; `dvh` es el valor dinámico correcto.
  *Alternativa descartada:* JS que calcule el viewport — frágil en SSR.

---

## Feature: hr-chat

### Propósito

Interfaz de chat donde el usuario escribe una pregunta de RR.HH. y recibe
la respuesta del backend Python local. El historial de la sesión se acumula
visualmente pero no se envía como contexto a la API.

### Comportamiento

**Estado inicial:**
- La pantalla muestra el historial vacío con un mensaje de bienvenida
  ("¿En qué puedo ayudarte hoy?") en el centro del área de mensajes.
- El input está habilitado y tiene foco automático al cargar.

**Flujo de pregunta:**
1. El usuario escribe en el textarea. `Enter` envía; `Shift+Enter` inserta
   salto de línea.
2. Al enviar: la pregunta aparece como bubble a la derecha del hilo.
   El input se limpia y se deshabilita.
3. Aparece un indicador de "pensando": tres puntos animados (pulse) a la
   izquierda del hilo, con el label "Mercurial está procesando tu consulta".
4. Cuando la API responde: el indicador desaparece y la respuesta aparece
   como bubble a la izquierda. El input se rehabilita y recupera el foco.
5. El scroll se posiciona automáticamente al último mensaje.
6. El usuario puede hacer scroll hacia arriba para ver mensajes anteriores
   de la misma sesión.

**Estado de error:**
- Si la API responde con error (4xx, 5xx, timeout de red): el indicador
  desaparece y aparece un bubble de error inline con el texto
  *"No se pudo obtener respuesta. Intentá de nuevo."* y un botón
  **"Reintentar"** que reenvía la última pregunta.
- El input vuelve a habilitarse.

**Input vacío:**
- El botón de envío (si lo hay como accesibilidad) y el Enter están
  deshabilitados si el campo está vacío o solo contiene espacios en blanco.

### Contrato

> **SUPERADO por `specs/hr-chat-redesign/spec.md` (feature 11, done).** El contrato
> de abajo (`Promise<string>`) describía un shape que nunca coincidió con el backend
> real — se dejaba `undefined` como respuesta. El contrato vigente es
> `hrService.query(question: string): Promise<{ answer: string, chunks: HrChunk[] }>`,
> leído de `query_result.system_answer`/`query_result.chunks_related`. Se conserva el
> texto original solo como registro histórico de la decisión errónea.

- Entrada (servicio): `hrService.query(question: string): Promise<string>`
  — devuelve el texto de respuesta o lanza `Error`.
- Salida visible: lista de exchanges `{ question: string, answer: string }`
  más el estado de carga y error.

### Casos límite

| Caso                                 | Comportamiento esperado                              |
|--------------------------------------|------------------------------------------------------|
| Pregunta vacía / solo espacios       | No se envía; input no hace submit                    |
| API demora > 30 s (configurar timeout) | Se trata como error de red; muestra error + Reintentar |
| Respuesta muy larga                  | El bubble hace scroll interno con `overflow-y: auto` |
| Pregunta muy larga (> 500 chars)     | Aceptada; no hay límite hard en el cliente por ahora |
| Usuario intenta enviar mientras carga | Input y Enter deshabilitados; imposible doble envío |

### Decisiones

- **Historial solo visual, sin contexto a la API.** El dominio hoy es
  "pregunta simple". Si el backend evoluciona para soportar contexto,
  el service cambia, no la UI. *Alternativa descartada:* enviar historial
  completo desde el inicio — acopla el cliente a una capacidad del backend
  no confirmada.
- **Scroll automático al último mensaje.** El usuario siempre ve la
  respuesta nueva. *Alternativa descartada:* "mostrar indicador de nuevo
  mensaje" — innecesario en un hilo lineal.
- **`Enter` envía, `Shift+Enter` salta línea.** Convención moderna de chat.
  *Alternativa descartada:* solo botón — peor UX en desktop.
- **Tres puntos animados para loading.** Más cálido que un spinner.
  *Alternativa descartada:* skeleton del bubble — más complejo de
  implementar y no aporta más claridad.
- **Error inline con Reintentar.** El usuario ve el error en el contexto
  de la conversación y puede actuar de inmediato. *Alternativa descartada:*
  toast — desaparece y obliga al usuario a reescribir la pregunta.
- **Endpoint real pendiente.** El `hrService` usará un base URL
  configurable vía variable de entorno `VITE_API_URL`. Hasta recibir
  los endpoints reales, el service lanzará un error descriptivo.

---

## Feature: api-integration

### Scope (decidido 2026-06-10)

Esta feature cubre **únicamente** dos reemplazos de stub:

| Servicio actual   | Endpoint real     |
|-------------------|-------------------|
| `hrService`       | `POST /api/query` |
| `ragService`      | `POST /api/ingest`|

**Decisión — `/api/evaluate` fuera de scope.**  
*Alternativa descartada:* integrar `POST /api/evaluate` en esta misma feature reemplazando el uso actual de `hrService` para evaluación.  
*Razón:* el equipo decidió que la lógica de evaluación no está confirmada en el contrato del backend para esta iteración; introducirla ampliaría el scope y bloquearía el cierre de la feature. Queda postergada a una feature futura.

---

### Contrato `POST /api/query`

> **SUPERADO por `specs/hr-chat-redesign/spec.md` (feature 11, done).** La respuesta
> real del backend es `{ "query_result": { "system_answer": "...", "chunks_related": [...],
> "user_question": "...", "intent": "...", "reasoning": "..." } }` — no `{ "result": "..." }`
> como se documentaba abajo. Ese campo `result` nunca existió en el backend real; fue
> una asunción incorrecta de esta spec original que el fix de la feature 11 corrigió.
> Se conserva el texto original solo como registro histórico.

#### Request

```
POST {VITE_API_URL}/api/query
Content-Type: application/json

{ "question": "<string>" }
```

- Campo único: `question` (string). No se envía historial de contexto.

#### Respuesta exitosa

```
HTTP 200
{ "result": "<string>" }
```

- El texto de respuesta se lee en `response.data.result`.
- El service expone ese string directamente a la capa de hooks/UI.

#### Decisiones de implementación

- **Cliente HTTP: axios** (no `fetch` nativo).  
  *Alternativa descartada:* `fetch` nativo — el equipo ya usa axios en el
  proyecto y centralizar el cliente facilita interceptors y manejo de errores.
- **Campo de respuesta: `result`** en lugar de otros candidatos (`answer`,
  `text`, `message`).  
  *Razón:* confirmado por el humano como contrato real del backend.

#### Decisiones de errores (aplica a todos los endpoints de esta feature)

- **Body de error estructurado: `{ "error": "<string legible>" }`** en todos los 4xx y 5xx.  
  *Alternativa descartada:* mensaje genérico opaco en el cliente (ej. "Ocurrió un error") — desaprovecha el mensaje que el backend ya calcula y dificulta el diagnóstico del usuario.  
  *Implementación:* en cada service, el bloque catch lee `error.response.data.error` de axios y relanza como `new Error(mensaje)`. La capa de hook/UI recibe siempre un `Error` con texto legible.

#### Pendiente de confirmar (abierto)

- Valor de timeout configurado en axios para esta llamada.
- ¿El campo `question` tiene un límite de longitud validado en el backend?

---

### Contrato `POST /api/ingest`

#### Request

```
POST {VITE_API_URL}/api/ingest
Content-Type: application/json

{ "documents": ["<texto plano del archivo 1>", "<texto plano del archivo 2>", ...] }
```

- El campo `documents` es un array de strings. Cada string contiene el texto
  plano extraído de un archivo en el cliente antes de enviar.
- El frontend lee los archivos con `FileReader.readAsText()` y construye el
  array. No se envían binarios ni base64.
- El array puede contener uno o más elementos (mínimo 1).

#### Respuesta exitosa

```
HTTP 200
{ "message": "<string informativo>" }
```

- El service trata cualquier respuesta `2xx` como éxito.
- El campo `message` es opcional para la UI: puede mostrarse como confirmación
  o descartarse. No es un dato funcional crítico.
- Si el backend retorna `204 No Content`, el service también lo trata como
  éxito (sin leer body).

#### Decisión — formato del body: `application/json` con array de strings (Opción A)

*Opción elegida (2026-06-10):* `{ "documents": ["contenido1", "contenido2"] }`
— array de strings con el texto plano de cada archivo, enviado como JSON.

*Opción B descartada:* `multipart/form-data` con los objetos `File` del
navegador adjuntados directamente.  
*Razón del descarte:* `multipart/form-data` requiere que el backend parsee
el multipart y gestione streams de bytes; el equipo confirmó que el backend
Python espera JSON. La serialización de texto plano en el cliente es simple
(`FileReader.readAsText`) y no agrega overhead significativo para los tamaños
de documento esperados en este contexto de RR.HH.

#### Casos límite

| Caso                                      | Comportamiento esperado                                                       |
|-------------------------------------------|-------------------------------------------------------------------------------|
| Array vacío `[]`                          | El service lanza `Error` antes de hacer fetch; la UI no llega a llamar la API |
| Archivo binario (PDF, imagen)             | Fuera de scope: la UI solo acepta `.txt` por ahora; validación en el input     |
| Archivo de texto muy grande (> 1 MB)      | Se envía igual; no hay límite hard en el cliente en esta iteración             |
| Más de N archivos simultáneos             | No hay límite definido en el cliente; el backend puede rechazar con 4xx        |
| Error 4xx / 5xx del backend               | Se aplica la política global de errores: releer `error.response.data.error`   |
| Timeout de red                            | Se trata como error; la UI muestra mensaje y permite reintentar                |

#### Pendiente de confirmar (abierto)

- Valor de timeout configurado en axios para esta llamada (por consistencia
  con `/api/query`, se asume 30 s hasta confirmación).
- Confirmación del campo exacto de la respuesta exitosa (`message` u otro).
- ¿Hay un límite de tamaño o cantidad de documentos validado en el backend?

---

## Feature: analytics

### Propósito

Registrar las interacciones clave del usuario (envíos, reintentos, ingesta
RAG) a través de un servicio propio de tracking que loguea a consola hoy
y puede redirigir a cualquier destino en el futuro sin cambiar los llamadores.

### Comportamiento

El `analyticsService` expone una única función pública `trackEvent`. Cuando
se la llama:

1. Construye un mensaje estructurado con el formato:
   `[analytics] <name> <payload_json>` donde `<payload_json>` es el resultado
   de `JSON.stringify(payload)`. Si no se pasa `payload`, omite esa parte.
2. Llama a `console.info` con ese mensaje.
3. Retorna `void` de forma síncrona.

Cualquier excepción interna (por ejemplo, un `JSON.stringify` que falle sobre
un objeto circular) se captura dentro del service y se descarta silenciosamente.
El flujo principal nunca se interrumpe por un fallo de analytics.

Los eventos que se trackean son exactamente los siguientes:

| Nombre de evento             | Cuándo se dispara                                              | Payload mínimo                                      |
|------------------------------|----------------------------------------------------------------|-----------------------------------------------------|
| `chat_message_sent`          | El usuario envía una pregunta en el chat (antes del fetch)    | `{ question_length: number }`                       |
| `chat_retry_clicked`         | El usuario hace click en "Reintentar" tras un error de API    | `{ question_length: number }`                       |
| `rag_form_submitted`         | El formulario RAG se envía exitosamente (ingesta completada)  | `{ file_count: number, total_size_bytes: number }`  |
| `rag_files_selected`         | El usuario selecciona archivos via input o drag-drop en RAG   | `{ file_count: number, total_size_bytes: number }`  |

No se trackean: eventos de teclado individuales, hover, scroll, focus/blur,
ni la respuesta de la API (solo la acción del usuario importa).

### Contrato

**`analyticsService.trackEvent`**

```
trackEvent(name: EventName, payload?: Record<string, unknown>): void
```

- `EventName` es un union type que restringe los nombres de evento a los
  cuatro valores listados en la tabla de comportamiento.
- `payload` es opcional. Si se omite, el log muestra solo el nombre.
- La función nunca lanza; el bloque interno tiene `try/catch` total.
- La función es síncrona; no retorna ni una Promise ni nada observable.

**Dónde se llama:**

`trackEvent` se invoca en la capa de **hooks** (`useHrChat`, `useRagForm`),
no en componentes ni features. El hook es quien conoce el resultado de las
acciones (éxito, error, reintentar) sin mezclar lógica con JSX.

**Salida observable (para tests):**

`console.info` espiado con `vi.spyOn(console, 'info')`. El test afirma que
fue llamado con el string exacto esperado.

### Casos límite

| Caso                                              | Comportamiento esperado                                                                      |
|---------------------------------------------------|----------------------------------------------------------------------------------------------|
| `trackEvent` lanza excepción internamente         | La excepción se captura dentro del service; el llamador no la ve; el flujo continúa         |
| `payload` contiene referencias circulares         | `JSON.stringify` falla; el catch lo descarta; no se loguea nada para ese evento             |
| `payload` es `undefined` (no se pasa)             | El log emite solo `[analytics] <name>` sin json al final                                    |
| `payload` es un objeto vacío `{}`                 | El log emite `[analytics] <name> {}` — es válido y se loguea igual                          |
| Se llama `trackEvent` con un nombre fuera del union | TypeScript rechaza en compilación; no existe caso de runtime si se usa el tipo correctamente |
| El hook llama `trackEvent` y luego la API falla   | El evento ya fue registrado (antes del fetch); el error de API no lo borra ni duplica       |

### Decisiones

- **`EventName` como union type, no string libre.**
  La lista de eventos es conocida y acotada en este proyecto. Un union type
  (`'chat_message_sent' | 'chat_retry_clicked' | 'rag_form_submitted' | 'rag_files_selected'`)
  detecta typos en compilación y hace autocomplete.
  *Alternativa descartada:* `string` libre — permite errores silenciosos de
  nombre de evento que nunca fallan en runtime pero contaminan los datos.

- **Llamada en la capa de hooks, no en componentes ni en el service de dominio.**
  Los hooks conocen el resultado de las acciones del usuario (cuando el submit
  tuvo éxito, cuando se retried) sin necesidad de lógica adicional en el
  componente. El service de dominio (`hrService`, `ragService`) no debe saber
  que existe analytics — eso violaría la separación de responsabilidades.
  *Alternativa descartada A:* llamar en el componente/feature — mezcla efectos
  secundarios con JSX.
  *Alternativa descartada B:* llamar desde `hrService`/`ragService` — acopla
  el service de dominio a una preocupación transversal.

- **`try/catch` total dentro de `trackEvent`; nunca propaga.**
  Analytics es una preocupación transversal no crítica. Si falla, el usuario
  no debe ver ningún efecto. El principio del proyecto es que errores de
  analytics jamás interrumpen el flujo principal.
  *Alternativa descartada:* dejar que el error burbujee — el hook tendría que
  envolverlo en su propio try/catch para no romper la UI, duplicando código
  defensivo.

- **`react-ga4` como destino en producción; `console.info` como fallback en desarrollo.**
  El service inicializa `ReactGA` con `VITE_GA_ID` si la variable está presente.
  Si `VITE_GA_ID` está vacía (entorno local sin configurar), `trackEvent` cae a
  `console.info` con el formato `[analytics] <name> <payload_json>` para no
  perder visibilidad durante el desarrollo.
  Los llamadores solo conocen `trackEvent`; el destino es un detalle interno.
  *Alternativa descartada A:* llamar `ReactGA.event` directamente en los hooks
  — el día que cambie la librería hay que buscar y reemplazar en múltiples archivos.
  *Alternativa descartada B:* usar `gtag` global vía script en `index.html`
  — requiere `@types/gtag.js` manual y acceso a `window.gtag`, más frágil que
  el wrapper tipado de `react-ga4`.

- **Payload mínimo útil, sin PII.**
  Los payloads registran longitudes y conteos, nunca el texto de la pregunta
  ni nombres de archivo. Esto reduce riesgo de privacidad y mantiene el
  analytics ligero.
  *Alternativa descartada:* incluir el texto completo de la pregunta en
  `chat_message_sent` — expone contenido potencialmente sensible de RR.HH.
  en los logs del navegador.

- **`rag_files_selected` se trackea en selección, no en submit.**
  Medir cuántos archivos selecciona el usuario (incluyendo los que luego
  abandona) aporta datos sobre intención de uso que el evento de submit
  exitoso no captura.
  *Alternativa descartada:* trackear solo el submit RAG — pierde información
  sobre usuarios que seleccionan archivos pero no completan el formulario.

---

## Feature: rag-form-v2

### Propósito

Rediseñar el formulario `/rag` con una zona de drag & drop moderna, lista
de archivos seleccionados con metadatos, validación inline de límites de
tamaño y cantidad, y feedback visual del estado de la carga — manteniendo
los tokens Zelda del proyecto.

### Comportamiento

**Estado inicial:**

- La página muestra una zona de drag & drop con un texto instructivo
  ("Arrastrá tus archivos `.txt` aquí o hacé clic para seleccionar") y un
  ícono visual de carga.
- La zona responde a `dragover` con un cambio de borde (borde dorado
  `--color-gold-bright`) que indica que puede recibir archivos.
- No hay archivos en la lista. El botón "Subir archivos" está deshabilitado.
- No hay errores visibles.

**Selección de archivos:**

Los archivos pueden agregarse de dos formas equivalentes:
1. Drag & drop sobre la zona: el usuario arrastra uno o más archivos desde
   el sistema de archivos y los suelta sobre la zona.
2. Click en la zona: abre el selector de archivos nativo del navegador
   (acepta solo `.txt`; atributo `multiple`).

En ambos casos, la lógica de incorporación es la misma:

- Se ignoran archivos cuya extensión no sea `.txt` (sin mensaje de error:
  simplemente no se agregan a la lista).
- Archivos con el mismo nombre que uno ya presente en la lista se ignoran
  (no reemplazan ni duplican).
- Los archivos válidos que no violen ningún límite se agregan a la lista
  acumulada.
- Si agregar los nuevos archivos superaría alguno de los tres límites
  (ver Contrato), los archivos del lote en exceso no se incorporan y se
  muestra un mensaje de error inline que describe qué límite se superó.
- La validación ocurre en el momento de selección / drop, antes de que el
  usuario haga clic en "Subir archivos".

**Lista de archivos seleccionados:**

Para cada archivo válido en la lista se muestra:
- Nombre del archivo.
- Tamaño en formato legible (`KB` si < 1 MB; `MB` si >= 1 MB, con un decimal).
- Botón de eliminar ("×") que quita el archivo de la lista de forma inmediata.

Al pie de la lista, un resumen con el total de archivos y el peso acumulado,
por ejemplo: "3 archivos — 1.4 MB / 8 MB".

**Botón "Subir archivos":**

- Habilitado únicamente si la lista tiene al menos un archivo y no hay ningún
  error de límite activo.
- Durante la carga: deshabilitado; se muestra el componente `Loading` existente.
- Después del éxito: se muestra mensaje de éxito y la lista se vacía.
- Después de un error de API: se muestra el error inline y el botón "Reintentar"
  (mismo patrón que el formulario actual).

**Zona drag & drop durante carga:**

- Mientras `isLoading` es `true`, la zona y el botón de eliminar de cada
  archivo están deshabilitados visualmente (opacity 0.5, cursor `not-allowed`).
  No se puede agregar ni quitar archivos durante la carga.

### Contrato

**Entradas del componente (a través de `useRagUpload` v2):**

```
files: File[]                              — lista acumulada de archivos válidos
validationError: string | null             — mensaje de error de límite (o null)
isLoading: boolean
status: 'idle' | 'success' | 'error'
error: string | null                       — error de API (solo en status === 'error')
addFiles(incoming: File[]): void           — agrega archivos a la lista; aplica reglas
removeFile(name: string): void             — quita un archivo por nombre
submit(): void
retry(): void
```

**Límites (constantes exportadas desde el hook o un archivo de constantes):**

```
MAX_FILE_SIZE_BYTES  = 2 * 1024 * 1024   // 2 MB por archivo
MAX_TOTAL_SIZE_BYTES = 8 * 1024 * 1024   // 8 MB total
MAX_FILE_COUNT       = 4                 // máximo 4 archivos
```

**Salidas visibles:**

- Lista de archivos con nombre, tamaño y botón de eliminar.
- Resumen de conteo y peso total.
- Mensaje de error de validación (si aplica).
- Estado de loading, éxito y error de API (igual que el formulario actual).

**Exit codes / estados de la operación:**

No hay exit code de proceso; el resultado se expresa en `status`:
- `'idle'` — estado inicial o tras vaciar la lista.
- `'success'` — ingesta completada; la lista se limpia.
- `'error'` — error de API; se mantiene la lista para reintentar.

### Casos límite

| Caso                                                      | Comportamiento esperado                                                                                  |
|-----------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Archivo único > 2 MB                                      | No se agrega a la lista; mensaje de error inline: "El archivo `<nombre>` supera el límite de 2 MB"      |
| Lote que llevaría el total > 8 MB                         | Los archivos del lote que causarían el exceso no se agregan; mensaje: "El total superaría los 8 MB"     |
| Lote que llevaría el conteo > 4 archivos                  | Los archivos en exceso no se agregan; mensaje: "No podés agregar más de 4 archivos"                     |
| Archivo con extensión distinta de `.txt` (ej. `.pdf`)     | Se ignora silenciosamente; no aparece en la lista ni genera mensaje de error                             |
| Archivo con mismo nombre que uno ya en la lista           | Se ignora silenciosamente; la lista no cambia; no genera error                                           |
| Drop de carpeta (directorio) en la zona                   | Se ignora (los `File` de carpetas no tienen extensión `.txt`; la regla de extensión los descarta)        |
| Lista vacía al hacer submit                               | Imposible: el botón está deshabilitado cuando no hay archivos                                            |
| Eliminar el único archivo de la lista                     | La lista queda vacía; el botón "Subir archivos" vuelve a deshabilitarse; el error de validación se borra |
| Eliminar un archivo y el total baja de los límites        | El mensaje de error de validación desaparece automáticamente                                             |
| Drag sobre la zona con `isLoading === true`               | La zona ignora el drop (no llama a `addFiles`); sin cambio visual de borde                              |
| Drag & drop de un `.txt` válido de exactamente 2 MB       | Se acepta (el límite es estricto: > 2 MB rechaza, == 2 MB acepta)                                       |
| Lote mixto (algunos válidos, algunos > 2 MB)              | Los archivos válidos se agregan; los inválidos se omiten; se muestra error por los omitidos              |
| Archivo de 0 bytes                                        | Se acepta (tamaño 0 < 2 MB; nombre y extensión `.txt` válidos); se muestra "0 KB" en la lista           |

### Decisiones

- **Zona de drag & drop: API nativa del navegador (`dragover`, `drop`) sin
  librería externa.**
  Los eventos `dragover`, `dragleave` y `drop` del DOM son suficientes para
  el caso de uso. Agregar una librería (react-dropzone, react-dnd) introduce
  una dependencia que el proyecto no necesita para ninguna otra feature y
  cuyo comportamiento debe testearse de todas formas mediante mocks.
  *Alternativa descartada:* `react-dropzone` — abstrae los eventos, pero
  requiere mock complejo en tests de RTL y agrega ~15 KB al bundle por
  funcionalidad que el equipo puede cubrir directamente.

- **Validación al seleccionar / drop, no al enviar.**
  El usuario recibe feedback inmediato al agregar archivos. Diferir la
  validación al submit genera una falsa sensación de que los archivos fueron
  aceptados, y obliga al usuario a leer un error justo cuando esperaba que
  comenzara la carga.
  *Alternativa descartada:* validar al submit — feedback tardío que degrada
  la experiencia y no tiene ventaja técnica en este caso.

- **Lote mixto: filtrar y continuar con los válidos; mostrar error por los omitidos.**
  El usuario no pierde los archivos buenos de un lote solo porque había uno
  inválido. El mensaje de error le informa cuáles fueron ignorados y por qué.
  *Alternativa descartada:* rechazar todo el lote si hay algún inválido —
  penaliza al usuario sin motivo técnico; fuerza a reseleccionar archivos que
  ya estaban bien.

- **Archivos duplicados (mismo nombre) se ignoran silenciosamente.**
  El mismo archivo seleccionado dos veces es un accidente del usuario, no
  una intención. Aceptarlo como duplicado enviaría el mismo texto al backend
  dos veces, inflando el índice RAG sin aportar información nueva. No se
  muestra error porque no es una acción inválida desde el punto de vista del
  usuario — simplemente no tiene efecto.
  *Alternativa descartada A:* reemplazar el existente — misma consecuencia
  funcional (texto idéntico) con más complejidad de estado.
  *Alternativa descartada B:* aceptar como duplicado — enviaría el mismo
  documento dos veces al backend, corrompiendo el índice RAG.

- **Botón "Subir archivos" habilitado solo con archivos válidos y sin error
  de límite activo.**
  Garantiza que el submit nunca llega al service con una lista vacía o en
  estado de error de validación. Reduce la superficie de defensa necesaria
  en el hook.
  *Alternativa descartada:* habilitar siempre y validar en submit — crea un
  segundo camino de validación duplicado y feedback tardío (ver decisión de
  timing de validación).

- **Reutilización del componente `Loading` existente sin modificaciones.**
  El componente `src/components/Loading/Loading` ya implementa los tres
  puntos animados que el diseño de `hr-chat` estableció. Reutilizarlo es
  coherente con el sistema de diseño y no requiere un nuevo componente de
  spinner para RAG.
  *Alternativa descartada:* un indicador de progreso de porcentaje — el
  backend no expone progreso por streaming en esta iteración; un porcentaje
  falso engaña al usuario.

---

## Feature: header-polish

### Propósito

Convertir el título "Mercurial" del header en un enlace navegable a `/` e
integrar el subtítulo "Consultas de RR.HH." como texto inline continuo junto
al título, eliminando la línea separada actual.

### Comportamiento

- El header muestra un bloque de texto único con el formato
  `Mercurial — Consultas de RR.HH.` en una sola línea (inline).
- El bloque completo (símbolo caduceo + texto) es un enlace (`<Link>`)
  que navega a `/` al hacer clic.
- El enlace **no** tiene estilo visual de hipervínculo: sin subrayado, sin
  cambio de color al hover. El color del título sigue siendo
  `--color-gold` y el separador/subtítulo sigue siendo
  `--color-text-muted`. El cursor es el puntero habitual de link
  (`cursor: pointer`) pero sin decoración adicional.
- El enlace es accesible: tiene `aria-label="Ir al chat"` para screen readers.
- El comportamiento es idéntico desde cualquier ruta activa (`/`, `/rag`,
  `/faq`): siempre navega a `/`.
- Si el usuario ya está en `/`, hacer clic en el enlace recarga el estado
  de la ruta pero no produce ningún efecto visible distinto (React Router
  maneja esto sin recarga de página).

**Separador acordado:** `—` (em dash). Formato exacto: `Mercurial — Consultas de RR.HH.`

**Estructura en el header (orden de izquierda a derecha):**
1. `CaduceoSymbol` (⚕) — parte del enlace.
2. Bloque de texto: `<span>Mercurial</span>` en dorado + ` — ` + `<span>Consultas de RR.HH.</span>` en muted.
3. `GearButton` (⚙) — permanece a la derecha, fuera del enlace.

### Contrato

- **Entrada:** ninguna prop nueva. El componente `AppShell` se modifica
  internamente.
- **Salida:** el `<Header>` renderiza un `<Link to="/">` que envuelve
  el caduceo y el bloque de texto. El `<Link>` se estiliza como
  `HeaderLink` (styled-component nuevo o extensión del existente).
- **Navegación:** `<Link>` de React Router (ya presente en el proyecto).
  No se usa `<a href="/">` para evitar recarga de página completa.

### Casos límite

| Caso                                              | Comportamiento esperado                                                                  |
|---------------------------------------------------|------------------------------------------------------------------------------------------|
| Usuario ya está en `/`                            | El clic navega a `/` sin recarga de página; React Router no produce error               |
| Viewport < 320px                                  | El texto puede truncarse con `text-overflow: ellipsis`; el link sigue siendo funcional  |
| El texto "Mercurial — Consultas de RR.HH." no cabe en una línea | El bloque puede hacer wrap; el caduceo permanece junto al texto       |
| Screen reader                                     | `aria-label="Ir al chat"` describe la acción; el símbolo ⚕ tiene su propio `aria-label` |
| Click en el GearButton mientras el menú está abierto | No se dispara la navegación; el GearButton está fuera del enlace                    |

### Decisiones

- **`<Link>` de React Router en lugar de `<a href="/">`.**
  React Router ya está en el proyecto. `<Link>` hace navegación client-side
  sin recarga de página, preservando el estado de la SPA.
  *Alternativa descartada:* `<a href="/">` — fuerza recarga completa de la
  página, pierde el historial de chat en memoria y es inconsistente con el
  resto del routing del proyecto.

- **Separador em dash `—` en lugar de punto `·`, dos puntos `:` o barra `|`.**
  El em dash es tipográficamente neutro y comunica continuidad sin jerarquía
  de navegación. Encaja con la estética editorial del sistema Zelda (parchment,
  Georgia serif). El punto medio `·` es más compacto pero menos legible a
  16px. Los dos puntos implican definición (semántica incorrecta). La barra
  implica separación o alternativa.
  *Alternativa descartada:* `·` (punto medio) — menos legible al tamaño de
  fuente del header; `|` — connotación de separador de opciones, no de subtítulo.

- **Sin estilo visual de link (sin subrayado, sin color diferenciado en hover).**
  El header es branding, no navegación secundaria. Un subrayado o cambio de
  color llamaría la atención sobre un enlace que la mayoría de los usuarios
  no necesita (ya están en `/`). La acción está disponible pero no es el
  foco de la UI. El cursor pointer es suficiente señal de interactividad para
  usuarios que exploran.
  *Alternativa descartada:* subrayado en hover — demasiado prominente para
  un elemento de branding que rara vez se usa; rompe la coherencia visual del
  header.

- **El caduceo (⚕) forma parte del enlace.**
  El caduceo es parte del bloque de branding. Dejarlo fuera del enlace
  crearía un hueco muerto entre el símbolo y el texto que el usuario
  intuitivamente esperaría que sea un todo clickeable.
  *Alternativa descartada:* solo el texto "Mercurial" como enlace, caduceo
  fuera — genera un área de clic fragmentada y menos intuitiva.

---

## Feature: faq-section

### Propósito

Proveer una ruta `/faq` con preguntas y respuestas sobre el sistema Mercurial,
accesible desde un footer global que aparece en todas las páginas de la app.

### Comportamiento

**Footer global:**

- Un componente `Footer` se agrega al `AppShell`, debajo del `<Main>`.
- El footer muestra un único enlace: `Preguntas frecuentes` que navega a `/faq`
  via `<Link>`.
- El footer es visualmente discreto: fondo `--color-surface`, borde superior
  `1px solid var(--color-border)`, texto en `--color-text-muted` tamaño
  `0.75rem`. Sin padding excesivo (máx. `0.5rem 1.25rem`).
- El footer es visible en `/`, `/rag` y `/faq`.

**Página `/faq`:**

- Usa el mismo layout que el resto (`AppShell` con header + footer).
- Muestra un título de página `<h1>Preguntas frecuentes</h1>` en
  `--color-gold`.
- Debajo del título, un botón o enlace `← Volver al chat` que navega a `/`.
- El contenido es una lista de preguntas y respuestas. Cada pregunta es un
  `<h2>` o `<h3>` y la respuesta es un `<p>`. No hay accordion ni expansión;
  todo visible por defecto.
- El contenido es estático: hardcodeado en el componente de página. No hay
  fetch ni configuración externa.

**Preguntas y respuestas incluidas (contenido acordado):**

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | ¿Qué tipo de consultas puedo hacer? | Podés consultar sobre políticas de licencias, vacaciones, beneficios, procedimientos de incorporación, normativas internas y cualquier duda general de Recursos Humanos. |
| 2 | ¿Cómo funciona el sistema de búsqueda? | Mercurial usa un sistema RAG (Retrieval-Augmented Generation): primero busca los fragmentos más relevantes en la base de conocimiento cargada por el equipo de RR.HH. y luego genera una respuesta en lenguaje natural basada en esos fragmentos. |
| 3 | ¿Las respuestas son siempre correctas? | El sistema hace su mejor esfuerzo, pero puede cometer errores o no tener información actualizada. Ante dudas críticas (licencias médicas, despidos, cuestiones legales), siempre confirmá con el área de RR.HH. directamente. |
| 4 | ¿Mis preguntas quedan guardadas? | Las preguntas y respuestas son visibles solo durante tu sesión en el navegador. Al cerrar la pestaña o recargar la página, el historial se borra. No se almacena historial en ningún servidor. |
| 5 | ¿Quién carga el conocimiento que usa el sistema? | El equipo de RR.HH. carga documentos (políticas, reglamentos, circulares) a través de la sección de carga RAG. El sistema solo sabe lo que fue explícitamente cargado. |
| 6 | ¿Qué pasa si el sistema no sabe la respuesta? | Mercurial indicará que no encontró información suficiente y te recomendará consultar directamente con RR.HH. No inventa respuestas cuando no hay base documental. |

### Contrato

- **Entrada del `Footer`:** ninguna prop. Lee la ruta activa de React Router
  para el `aria-current` del enlace (opcional, para accesibilidad).
- **Entrada de `FaqPage`:** ninguna prop. Contenido completamente estático.
- **Salida del `Footer`:** un `<footer>` con un `<Link to="/faq">`.
- **Salida de `FaqPage`:** JSX con `<h1>`, enlace de vuelta, y pares
  `<h2>`/`<p>` para cada pregunta.
- **Ruta nueva:** `/faq` → `FaqPage`. Se agrega al router existente.
- **Sin fetch, sin hooks de datos, sin estado:** la página es puramente
  presentacional.

### Casos límite

| Caso                                              | Comportamiento esperado                                                                    |
|---------------------------------------------------|--------------------------------------------------------------------------------------------|
| Usuario navega directamente a `/faq` por URL      | La página se monta normalmente con header + footer + contenido estático                   |
| Usuario hace clic en "← Volver al chat" desde `/faq` | Navega a `/` sin recarga de página                                                    |
| Footer visible en `/rag`                          | El enlace a `/faq` está presente y funcional; no hay conflicto con la navegación de RAG   |
| Footer visible en `/faq`                          | El enlace a `/faq` sigue presente (el usuario ya está ahí); no hay error de ruta circular |
| Viewport muy estrecho (< 320px)                   | El footer y el contenido de FAQ no rompen el layout; texto puede wrappear                 |
| Screen reader navega la FAQ                       | Los `<h2>` permiten navegación por encabezados; el enlace de vuelta tiene texto descriptivo |
| Ruta inexistente (ej. `/faq/algo`)                | El router existente maneja la ruta 404; fuera de scope de esta feature                    |

### Decisiones

- **Footer agregado al `AppShell` existente, no como componente de layout separado.**
  `AppShell` ya es el punto único de estructura global (header + main). Agregar
  el footer ahí garantiza que aparece en todas las rutas sin modificar cada
  página individualmente.
  *Alternativa descartada:* agregar el footer en cada página por separado —
  duplicación innecesaria; si el contenido del footer cambia hay que actualizarlo
  en múltiples lugares.

- **Contenido de FAQ hardcodeado en el componente de página, no configurable.**
  Las preguntas y respuestas son estables y conocidas. Un sistema de
  configuración externo (CMS, JSON, variable de entorno) agrega complejidad
  sin beneficio en este contexto: no hay usuarios no-técnicos que necesiten
  editar la FAQ sin deploy, y el contenido no cambia con frecuencia.
  *Alternativa descartada:* array de objetos `{ question, answer }` importado
  desde un archivo de datos separado — introduce una capa de indirección sin
  ventaja real; el contenido sigue siendo estático y requiere deploy para
  cambiar.

- **Todo el contenido de FAQ visible por defecto, sin accordion ni expansión.**
  La FAQ tiene seis preguntas cortas. Un accordion añade interacción sin
  beneficio de legibilidad para un contenido tan acotado. La visibilidad
  total facilita la navegación por teclado y screen readers.
  *Alternativa descartada:* accordion (details/summary o componente custom) —
  overhead de implementación y tests para ocultar contenido que es breve y
  que el usuario necesita leer en su totalidad.

- **`<h2>` por pregunta dentro de la página `/faq`.**
  Los encabezados de nivel 2 permiten que los screen readers naveguen la FAQ
  por estructura semántica. Usar `<h3>` o `<strong>` sería semánticamente
  incorrecto dado que el `<h1>` es el título de la página.
  *Alternativa descartada:* `<strong>` o `<dt>/<dd>` — `<strong>` no
  aporta estructura navegable; `<dl>` es semánticamente válido para glosarios
  pero menos familiar que el patrón `<h2>`/`<p>` para FAQ.

- **Botón "← Volver al chat" en `/faq` como `<Link to="/">`.**
  El usuario que llega a la FAQ desde el footer necesita un camino claro de
  regreso al flujo principal. Un enlace explícito es más descubrible que
  el botón atrás del navegador, especialmente si el usuario llegó directo
  por URL.
  *Alternativa descartada:* depender del botón atrás del navegador — no
  funciona si el usuario navegó directo a `/faq` por URL; no es una UX
  explícita.

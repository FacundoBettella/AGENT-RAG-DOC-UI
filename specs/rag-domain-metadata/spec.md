# rag-domain-metadata — spec

> Estado: **cerrada**. Sin preguntas abiertas. Lista para destilar Gherkin.
>
> Precedentes: `specs/design-system-shell/spec.md` (10), `specs/hr-chat-redesign/spec.md` (11),
> `specs/contract-analysis/spec.md` (12). Tokens, tipografía, iconos, patrón Container,
> manejo de error inline y contrato de `extractBackendError` se **heredan** de ahí; esta
> spec solo declara lo que agrega o cambia.

## Propósito

Agregar a `/rag` la elección del dominio de destino (`hr` / `tech` / `finance`) y enviarlo en `POST /api/ingest`, que hoy falla porque `ragService` manda el payload incompleto.

## Contrato

### Alcance

**Dentro:**

- `src/services/ragService.ts` — `upload` pasa a recibir el dominio y a devolver el resultado de la ingesta.
- `src/constants/apiRoutes.ts` — se agrega `INGEST`.
- `src/hooks/useRagForm.ts` — estado del dominio elegido, `canSubmit` y analytics.
- `src/pages/RagPage.tsx` — el selector de dominio, el mensaje de éxito con datos reales y el **retematizado 1:1 a Tailwind** (ver §Retematizado).
- `src/pages/RagPage.styles.ts` — **se elimina** (Decisión 14).
- `src/hooks/useRagUpload.ts` — **se elimina** (Decisión 12).
- `tests/analyticsHooks.test.ts` y `tests/RagForm.test.tsx` — se reapuntan a `useRagForm` (misma intención de escenario, otro hook).

**Fuera:**

- `HrChat`, `ContractAnalysis`, `SettingsPage`, `FaqPage` y el shell: no se tocan. `FaqPage` sigue en styled-components y `GlobalStyles` sigue inyectándose (hereda Decisiones 9 y 10 de `design-system-shell`).
- **Rediseño visual de `/rag`**: no hay mockup de "Base de conocimiento"; esto es un retema, no un rediseño (Decisión 14).
- **Refactor estructural a `src/features/RagUpload/` con Container + presentacionales**: fuera de alcance (Decisión 18).
- **CORS en el RAG AGENT API**: es un fix real y necesario, pero lo aplica el tech-lead directo en el otro repo. Ver §Dependencia externa.
- **Propagar el nombre de archivo como `source`** (deuda de `hr-chat-redesign`): fuera de alcance, ver §Deuda que sigue abierta.
- Filtrado por dominio en la consulta (`POST /api/query` ya enruta solo con el orquestador).
- Ver el contenido ya indexado, borrarlo o re-indexarlo: el RAG AGENT API no expone endpoints para eso (`routes/` = `health`, `query`, `ingest`, `evaluate`).
- Dominio por archivo dentro de una misma tanda (Decisión 2).
- Responsive/mobile (hereda Decisión 20 de `design-system-shell`).

### Entradas

- **Sin mockup de referencia.** A diferencia de las features 11, 12 y 13, no existe HTML de "Base de conocimiento" en `progress/mockups/`. Consecuencia directa: esta feature **no rediseña** el layout de `/rag`, solo lo retematiza. La fuente del diseño es la pantalla actual + los tokens de `src/index.css`.
- **Backend**: `POST {VITE_RAG_API_BASE_URL}/api/ingest`, body `{ domain, documents }`
  (verificado en `RAG AGENT API/src/api/schemas.py`, `IngestRequest`; `domain` es
  `Literal["hr","tech","finance"]` **requerido**, sin default).
- **Archivos**: los mismos `.txt` que ya valida `useRagForm` (máx. 2 MB por archivo, 8 MB total, 4 archivos, sin duplicados por nombre). Ninguna de esas reglas cambia.

### Contrato de `ragService.upload`

```ts
export type RagDomain = 'hr' | 'tech' | 'finance'

export interface IngestResult {
  domain: RagDomain
  documentsReceived: number
  chunksIndexed: number
  totalInStore: number
}

upload(files: File[], domain: RagDomain): Promise<IngestResult>
```

- URL: `${BASE_URL}${API_ROUTES.INGEST}` con `INGEST = '/api/ingest'`.
- Body: `{ domain, documents }`, donde `documents` son los contenidos de texto de los archivos, en el orden de la lista visible. El nombre de archivo **no** viaja (el schema no tiene dónde ponerlo — ver §Deuda que sigue abierta).
- Sin archivos → lanza `Error('No se seleccionaron archivos para cargar.')` (guard actual, se conserva).
- **Validación del payload de respuesta**: `ingest_result.chunks_indexed` y
  `ingest_result.documents_received` deben ser números finitos ≥ 0. Si no, `upload` **lanza
  `Error`** (hereda Decisión 2 de `hr-chat-redesign`: payload inválido es error, no UI que miente).
  `total_in_store` ausente → `0`. `domain` se toma del que se envió, no del que vuelve.
- Salida en camelCase; el snake_case del backend no se filtra a la UI (hereda Decisión 23 de `contract-analysis`).

**Errores del backend** (todos con body `{ "error": string }` — `RAG AGENT API/src/api/exception_handlers.py` reescribe también los `HTTPException` y los `RequestValidationError`):

| Código | Causa | Qué ve el usuario |
|---|---|---|
| 400 | el server no tiene agente para ese dominio (misconfiguración de `app.state.agents`) | `error` del backend |
| 422 | body inválido (inalcanzable desde la UI, ver Decisión 15) | `error` del backend |
| 500 | falla del agente / del vector store | `error` del backend |
| — | red, timeout o **CORS** (ver §Dependencia externa) | `'No se pudieron subir los archivos. Intentá de nuevo.'` |

La traducción la sigue haciendo `extractBackendError` sin cambios (el RAG manda `error`, no `detail`).

### Estado (`useRagForm`)

Se agrega al retorno actual:

```ts
domain: RagDomain | null      // null = todavía no eligió
setDomain: (domain: RagDomain) => void
result: IngestResult | null   // solo en status 'success'
canSubmit: boolean            // files.length > 0 && validationError === null
                              //   && domain !== null && status !== 'loading'
```

- `files`, `validationError`, `status`, `apiError`, `addFiles`, `removeFile`, `submit`, `retry` conservan su semántica.
- `submit()` con `canSubmit === false` no llama al service (hereda el criterio de `@s15` de `HrChat` y de la Decisión de `contract-analysis` sobre doble envío).
- Tras un éxito: `files` queda vacío (comportamiento actual, `@s17` de `rag-form-v2`), **`domain` se conserva** (Decisión 6) y `result` queda disponible para el mensaje.
- Cambiar de dominio no toca `files` ni `validationError` (Decisión 11).
- `retry()` reenvía los mismos archivos **al mismo dominio**.

### Salidas (estructura de la pantalla)

Se conserva el orden actual de `/rag` (título, texto explicativo, dropzone, lista, resumen, error de validación, botón, loading, feedback). Se **agrega** un bloque y se **cambia** un texto:

**1. Selector de dominio — entre el texto explicativo y la dropzone.**

- `<fieldset>` con `<legend>`: **"Dominio de la base de conocimiento"**.
- Texto de ayuda (asociado por `aria-describedby`): **"Todos los archivos de esta carga se indexan en el dominio elegido."**
- Tres `<input type="radio">` nativos con el mismo `name`, presentados como pills, **ninguno marcado al cargar**:

| Valor | Label | Ayuda | Icono (Material Symbols) |
|---|---|---|---|
| `hr` | RR.HH. | Políticas, vacaciones, licencias | `groups` |
| `tech` | Tecnología | Soporte, equipos, accesos | `devices` |
| `finance` | Finanzas | Reintegros, gastos, facturación | `payments` |

- Estados: seleccionado `bg-primary text-on-primary`; no seleccionado `border-outline-variant text-on-surface-variant`; foco con anillo `:focus-visible` (hereda la tabla de estados de `design-system-shell`).
- Deshabilitados mientras `status === 'loading'` (Decisión 10).

**2. Botón "Subir archivos"** — `disabled` mientras `canSubmit` sea `false`. Con archivos válidos y **sin** dominio elegido queda deshabilitado, sin mensaje de error (el `<legend>` y la ayuda ya explican qué falta; hereda el criterio de `@s13` de `rag-form-v2`: no se grita por algo que el usuario todavía no hizo).

**3. Mensaje de éxito** — reemplaza el actual "Los archivos fueron indexados correctamente." por, con los datos reales de `IngestResult`:

> **Se indexaron {chunksIndexed} fragmentos de {documentsReceived} archivo(s) en la base de {Dominio}.**

`{Dominio}` es el label de la tabla de arriba. Singular/plural de "archivo" y "fragmento" según el número.

**4. Error y "Reintentar"** — sin cambios respecto de `rag-form-v2` (`@s18`, `@s19`).

### Retematizado de `RagPage` (styled-components → Tailwind)

Patrón de referencia: la migración de `HrChat` en `specs/hr-chat-redesign/spec.md` (que también
eliminó su `*.styles.ts` y pasó a utilities con los tokens de `src/index.css`). **Diferencia
clave: allá fue migración + rediseño con mockup; acá es retema puro.** Reglas:

| Eje | Regla |
|---|---|
| Elementos | Los mismos, ninguno se agrega ni se saca (salvo el `fieldset` del dominio, que es la feature) |
| Orden en el DOM | Idéntico al actual |
| Copia | Idéntica, salvo el mensaje de éxito (§Salidas punto 3) y los textos del selector |
| Roles y `aria-*` | Idénticos: `role="region"` + `aria-label="Zona de carga de archivos"`, `aria-label="Seleccionar archivos"`, `aria-label="Eliminar <archivo>"`, `role="alert"` del error de validación, `role="status"` del `Loading` |
| `data-*` | `data-dragging` y `data-loading` se conservan como atributos y pasan a manejar la apariencia vía `data-[dragging=true]:…` de Tailwind |
| Colores | Tokens MD3 de `src/index.css`. Equivalencias: `--color-surface` → `bg-surface-container-low`; `--color-border` → `border-outline-variant`; `--color-text-primary` → `text-on-surface`; `--color-text-muted` → `text-on-surface-variant`; el acento de drag activo → `border-primary`; error → `bg-error-container text-on-error-container` |
| Tokens nuevos | **Ninguno.** Si aparece una necesidad de token nuevo, es señal de que se está rediseñando |
| Layout | Se conserva el contenedor centrado con ancho máximo del `PageWrapper` actual, ahora con utilities |

`src/pages/RagPage.styles.ts` se elimina. `src/components/Loading/` **no** se toca (lo usan otras
pantallas).

### Analytics

- `rag_files_selected` — `{ file_count, total_size_bytes }`, sin cambios de payload; pasa a dispararse desde `useRagForm.addFiles`.
- `rag_form_submitted` — se le agrega `domain`: `{ file_count, total_size_bytes, domain }`. Se dispara en el `submit()` efectivo, no en los bloqueados por `canSubmit`.
- No se agregan eventos nuevos (Decisión 13).

### Tests

- `tests/RagFormV2.test.tsx` — los 22 escenarios se **preservan**; los que llegan al submit necesitan elegir dominio antes, y `mockedUpload` pasa a resolver un `IngestResult`. Los asserts de `@s2`/`@s21` sobre `data-dragging` / `data-loading` se conservan tal cual (son atributos DOM, independientes del sistema de estilos — por eso el retematizado no pone en riesgo esta batería).
- `tests/ApiIntegration.test.ts` — los escenarios de `ragService` (`@s7`–`@s15`) se **adaptan**: el POST ahora asserta `{ domain, documents }` y el retorno deja de ser `void`.
- `tests/analyticsHooks.test.ts` y `tests/RagForm.test.tsx` — se reapuntan de `useRagUpload` a `useRagForm`.
- Archivo nuevo no hace falta: la pantalla ya tiene el suyo.

## Decisiones

1. **`upload(files, domain)` con el dominio como parámetro requerido y tipado.** El compilador impide repetir el bug. *Descartada:* `domain` opcional con default `'hr'` — reintroduce el fallo en silencio y manda conocimiento al índice equivocado.

2. **Un dominio por tanda** (confirmado con el humano). `IngestRequest` lleva un solo `domain`. *Descartada:* dominio por archivo — obligaría a N requests y a manejar éxito parcial sin transacción.

3. **Sin dominio preseleccionado; el submit queda deshabilitado hasta elegir.** La ingesta es irreversible: el RAG AGENT API no expone borrado ni re-indexado. *Descartada:* default `'hr'` — un clic distraído contamina un índice para siempre.

4. **Tres radios nativos con apariencia de pills, dentro de un `fieldset`.** Las 3 opciones quedan visibles y el control es accesible por teclado sin ARIA a mano. *Descartada:* `<select>` — esconde las opciones y agrega un clic; y tabs — el rol `tab` exige `tabpanel`.

5. **Etiquetas "RR.HH." / "Tecnología" / "Finanzas".** Es el vocabulario que ya usa el saludo del chat (`hr-chat-redesign`). *Descartada:* "IT y Tecnología" — introduce un sinónimo nuevo para un dominio ya nombrado.

6. **El dominio elegido sobrevive al éxito.** El caso real es subir varias tandas al mismo dominio. Hereda Decisión 9 de `contract-analysis`. *Descartada:* resetear el selector — obliga a re-elegir en cada tanda.

7. **`upload` devuelve `IngestResult` y el éxito nombra dominio y fragmentos.** El backend ya manda esos números y hoy se tiran. *Descartada:* seguir devolviendo `void` — mensaje genérico donde hay dato real.

8. **Payload de respuesta inválido = `Error`, no éxito vacío.** Hereda Decisión 2 de `hr-chat-redesign`. *Descartada:* mostrar "0 fragmentos" — presenta como éxito una ingesta que quizá no ocurrió.

9. **`INGEST` se muda a `src/constants/apiRoutes.ts`.** Hereda Decisión 23 de `hr-chat-redesign`, que dejó explícitamente `ragService` para esta feature. *Descartada:* URL literal en el service — lo prohíbe `conventions.md` del perfil.

10. **El selector se deshabilita durante la carga.** Hereda `@s21` de `rag-form-v2` (zona y botones × deshabilitados mientras sube). *Descartada:* dejarlo activo — el request ya salió con el dominio anterior.

11. **Cambiar de dominio no limpia la lista de archivos.** Son ejes independientes; el usuario suele corregir el destino, no el contenido. *Descartada:* resetear la selección — castiga un cambio de opinión con re-subir todo.

12. **`useRagUpload` se elimina y su tracking se reconecta en `useRagForm`.** Hoy no lo monta ninguna página (`RagPage` usa `useRagForm`): `/rag` no emite un solo evento y los tests de la feature 6 prueban código muerto. *Descartada:* dejarlo — mantiene la métrica rota.

13. **`rag_form_submitted` suma `domain`; no se crea evento nuevo.** Hereda Decisión 21 de `contract-analysis`: sin pregunta de producto no se agrega evento. *Descartada:* `rag_domain_selected` — mide un clic intermedio que nadie preguntó.

14. **Se retematiza `/rag` a Tailwind/MD3 1:1, sin rediseñar** (confirmado con el humano). Escribir el selector en styled-components agranda un sistema en retiro (Decisión 9 de `design-system-shell`). *Descartada:* mínimo diff en styled-components — deja UI nueva con tokens Zelda dentro de un shell MD3.

15. **No se sanea el 422 del RAG AGENT API.** Su handler devuelve `{ error: str(exc) }` — el repr crudo de Pydantic — pero el selector vuelve ese caso inalcanzable desde la UI. *Descartada:* filtrar por longitud o forma del mensaje — heurística frágil sobre un caso muerto.

16. **El `source` fijo `"api"` del indexer queda fuera: "implica cambiar el back"** (motivo textual del humano). No es que no importe — el costo de tocar el schema de otro repo no se justifica en un fix acotado. *Descartada:* sumar `sources` a `IngestRequest` acá.

17. **El CORS del RAG AGENT API lo aplica el tech-lead directo en el otro repo, fuera de este pipeline.** Es config, no contrato, y no hay escenario Gherkin que lo verifique desde esta UI. *Descartada:* meterlo en el alcance del `developer` — trabajo de otro repo, sin test que lo muerda acá.

18. **`RagPage` conserva su estructura actual (página + `useRagForm`); no se refactoriza a `src/features/` con Container.** Es un retema, no un rediseño; el patrón Container de las Decisiones 21 (`hr-chat-redesign`) y 22 (`contract-analysis`) se ganó su lugar donde había varios componentes con estado compartido, y acá hay uno solo. *Descartada:* refactor estructural — churn sin pedido sobre 22 escenarios verdes.

## Dependencia externa (fuera del alcance de código, en curso)

`RAG AGENT API/src/api/main.py` **no registra `CORSMiddleware`** (verificado línea por línea).
Un `POST` con `application/json` es *preflighted*: el navegador manda `OPTIONS`, no hay
`Access-Control-Allow-Origin` y la llamada muere antes de salir. Afecta a `/api/ingest` **y** a
`/api/query` (el chat de la feature 11). Es el mismo problema que la PA-1 de `contract-analysis`,
resuelto allá agregando `CORSMiddleware` a DOC AGENT API.

**Estado: confirmado y resuelto/en curso por el tech-lead**, aplicado directo en el repo externo
con el mismo criterio de la feature 12. Queda anotado acá para trazabilidad: sin ese fix, esta
feature arregla el payload pero `/rag` sigue sin funcionar de punta a punta en el navegador.
La spec no depende de la solución — el fallo por CORS entra por la rama de error de red y muestra
el mensaje genérico, así que los escenarios Gherkin se verifican igual.

## Deuda que sigue abierta

El `source` fijo `"api"` de `RAG AGENT API/src/services/indexer.py::index_texts` (cada
`FAQDocument` se crea con `source="api"` y `title=f"document-{i}"`; el `Chunker` lo copia al
metadata y `RAGResponse.to_dict` lo expone tal cual). Consecuencia visible: en el panel "Fuentes
de la respuesta" del chat, todo lo cargado desde `/rag` se titula **"api"**.

- **Se descarta en esta feature por decisión del humano** (Decisión 16): implica cambiar el back.
- **Sigue documentada** como PREGUNTA ABIERTA en `specs/hr-chat-redesign/spec.md`.
- **Candidata a una feature de backend futura.** La forma concreta, si se encara: `IngestRequest`
  suma `sources: list[str] | None = None` (aditivo, compatible hacia atrás), `index_texts(texts,
  sources)` usa `sources[i]` con fallback a `"api"`, y el front manda `files.map(f => f.name)`.

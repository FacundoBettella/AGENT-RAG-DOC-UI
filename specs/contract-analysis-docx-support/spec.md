# contract-analysis-docx-support — spec

> Estado: **cerrada**. Sin preguntas abiertas. Lista para destilar Gherkin.
>
> Precedentes: `specs/contract-analysis/spec.md` (12, `done`) y
> `specs/rag-domain-metadata/spec.md` (14). Layout, patrón Container, contexto,
> validación por dropzone, error inline, contrato de `docAgentService.analyze` y
> `extractBackendError` se **heredan** de ahí sin cambios. Esta spec solo declara lo que
> cambia: extensiones aceptadas, copia y el ícono del archivo cargado.

## Propósito

Permitir que `/contracts` acepte también `.docx` —formato que DOC AGENT API ya procesa— y
corregir la copia que hoy afirma que solo se admiten imágenes.

## Contrato

### Alcance

**Dentro:**

- `src/hooks/useContractAnalysis.ts` — `VALID_EXTENSIONS`, mensajes de error y rename de
  `MAX_IMAGE_SIZE_BYTES`.
- `src/features/ContractAnalysis/ContractAnalysis.constants.ts` — copia neutral respecto del
  formato + `FILE_INPUT_ACCEPT`.
- `src/features/ContractAnalysis/components/FileDropzone/FileDropzone.tsx` — ícono del estado
  "con archivo" según el tipo.
- `tests/ContractAnalysis.test.tsx` — los escenarios que assertan la copia vieja (`@s5`, `@s6`,
  `@s8`, `@s9`, `@s10`) se adaptan; se suman los escenarios nuevos.

**Fuera:**

- `docAgentService`, `httpError`, `apiRoutes`, contexto, `UploadColumn`, `ResultPanel`,
  `ContractsPage`: no se tocan (Decisión 3).
- Cambios en DOC AGENT API: ninguno; el soporte `.docx` ya está en producción allá.
- Otros formatos (`.pdf`, `.txt`, `.doc` legado): fuera (Decisión 2).
- Preview del contenido del `.docx`, conteo de páginas o metadata del documento.
- Layout, tokens, responsive: sin cambios (hereda Decisión 20 de `design-system-shell`).
- Mover los mensajes de validación del hook al módulo de constantes (Decisión 9).

### Entradas

- **Mockup de referencia:** no hay uno nuevo. Sigue valiendo el heredado de la feature 12,
  `progress/mockups/design-system-shell/mockup-analizador-contratos.html` (gitignoreado), solo
  como referencia de layout — esta feature no cambia estructura visual.
- **Backend** (verificado en `DOC AGENT API`):
  - `src/infrastructure/parsing/document_parser.py`:
    `IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}`, `DOCX_EXTENSIONS = {".docx"}`,
    `VALID_EXTENSIONS = IMAGE_EXTENSIONS | DOCX_EXTENSIONS`. `_validate_document_path` valida
    por **sufijo del nombre**, igual que antes.
  - `src/api/analysis.py`: los campos del `multipart` siguen llamándose `original_image` y
    `amendment_image`; cada `UploadFile` se guarda a un temp file **conservando su sufijo** y se
    procesa de forma independiente. No existe validación cruzada entre ambos archivos.
  - Errores: `DocumentValidationError` → 400, `DocxParsingError` → 502 (misma rama que
    `VisionParsingError`), ambos con body `{ "detail": string }`. Ya cubiertos por la tabla de
    errores de `specs/contract-analysis/spec.md`; el service no cambia.

### Validaciones de archivo (cliente)

Se siguen aplicando al seleccionar, por archivo y de forma independiente:

| Regla | Valor nuevo | Cambio |
|---|---|---|
| Extensión | `.png`, `.jpg`, `.jpeg`, `.docx` (case-insensitive, por sufijo del nombre) | se suma `.docx` |
| Tamaño máximo | `MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024` | solo rename (Decisión 4) |
| Cantidad | exactamente 1 por dropzone | sin cambio |
| Relación entre los dos archivos | **ninguna**: pueden ser de tipos distintos | explícito (Decisión 5) |

- `VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.docx']`.
- El `<input>` lleva `accept=".png,.jpg,.jpeg,.docx"`; la validación **no** confía en el `accept`
  (no aplica a drag & drop) — hereda Decisión 3 de `contract-analysis`.
- Archivo rechazado: no se carga, no reemplaza al que ya estaba y muestra error inline en su
  propia dropzone. El error se limpia al aceptar un archivo válido. Sin cambios.
- El archivo original y la enmienda se validan por separado: aceptar un `.docx` en una dropzone
  no restringe lo que acepta la otra.

### Copia (`ContractAnalysis.constants.ts`)

Redacción neutral respecto del formato. Estructura, orden y clases: idénticos.

| Constante | Valor nuevo |
|---|---|
| `DROPZONE_INSTRUCTIONS` | `'Arrastrá el documento acá o hacé clic para seleccionar'` |
| `DROPZONE_HINT` | `'PNG, JPG o DOCX (máx. 10 MB)'` |
| `FILE_INPUT_ACCEPT` | `'.png,.jpg,.jpeg,.docx'` |
| `IDLE_SUBTITLE` | `'Leemos los dos documentos y comparamos el texto para detectar qué cambió entre el contrato y su enmienda.'` |
| `IDLE_STEP_1_TITLE` | `'01 Lectura de los documentos'` |
| `IDLE_STEP_1_TEXT` | sin cambio (`'Se lee el texto de cada contrato preservando su numeración de cláusulas.'`) |
| `LOADING_NOTE` | `'Puede tardar hasta un minuto: se leen los dos documentos y después se comparan.'` |

Mensajes de validación (siguen viviendo en `useContractAnalysis.ts`, ver Decisión 9):

| Constante | Valor nuevo |
|---|---|
| `UNSUPPORTED_FORMAT_MESSAGE` | `'Formato no soportado. Subí un archivo .png, .jpg, .jpeg o .docx.'` |
| `FILE_TOO_LARGE_MESSAGE` | `'El archivo supera el límite de 10 MB.'` |

No cambian: `PAGE_TITLE`, `PAGE_SUBTITLE`, títulos de las cards, `REQUIRED_BADGE_LABEL`,
`SUBMIT_*`, `IDLE_TITLE`, `IDLE_STEP_2_*`, `LOADING_TITLE`, `RETRY_LABEL`, `SUCCESS_*`.

### Ícono del archivo cargado (`FileDropzone`)

El estado "con archivo" hoy renderiza siempre `image`. Pasa a depender del sufijo del nombre:

| Sufijo | Ícono (Material Symbols) |
|---|---|
| `.docx` | `description` |
| `.png`, `.jpg`, `.jpeg` | `image` |

El ícono es `aria-hidden="true"`, igual que hoy: es decoración, no información — el nombre del
archivo (con su extensión visible) ya está en el DOM. El estado vacío conserva `upload_file`.

### Analytics

Sin eventos nuevos y sin cambios de payload. `contract_analysis_submitted` sigue enviando
`{ originalSizeBytes, amendmentSizeBytes }` (Decisión 8).

### Tests

- `tests/ContractAnalysis.test.tsx`: `@s5`, `@s6`, `@s8` (mensajes de validación), `@s9` (copia
  del `idle`) y `@s10` (nota de loading) se adaptan a los textos nuevos, misma intención.
  Escenarios nuevos: acepta `.docx`, acepta original imagen + enmienda `.docx`, rechaza `.doc`,
  ícono según tipo.
- `tests/DocAgentService.test.ts`: no se toca. Los `detail` de ejemplo que mencionan "imagen" son
  strings del backend simulado, no copia de esta UI.

## Decisiones

1. **`.docx` se suma a `VALID_EXTENSIONS` validando por sufijo del nombre.** Espeja
   `document_parser.py`, que valida igual. *Descartada:* validar por `file.type` — un `.docx`
   arrastrado desde algunos orígenes llega con MIME vacío y sería rechazado sin motivo.

2. **Solo `.docx`; `.doc` legado, `.pdf` y `.txt` siguen rechazados.** `python-docx` no lee el
   binario `.doc` y el backend no los declara válidos. *Descartada:* aceptarlos y dejar que el
   backend devuelva 400 — error tardío tras subir el archivo.

3. **Cambio de texto, extensión e ícono; no se toca el service ni la estructura.** El endpoint,
   los campos `original_image`/`amendment_image` y el pipeline ya soportan `.docx`.
   *Descartada:* renombrar los campos del `FormData` — rompe el contrato con el backend.

4. **Un único límite de 10 MB para todos los formatos; `MAX_IMAGE_SIZE_BYTES` pasa a
   `MAX_FILE_SIZE_BYTES`.** Un `.docx` de contrato pesa muy por debajo del techo.
   *Descartada:* límite por tipo — dos números que explicar en la copia sin ganancia real.

5. **Original y enmienda pueden ser de tipos distintos entre sí.** El backend los parsea por
   separado, sin validación cruzada; el caso real es contrato escaneado + enmienda `.docx`.
   *Descartada:* exigir que coincidan — restricción inventada por la UI.

6. **Copia neutral ("documento"/"archivo") en vez de enumerar formatos en prosa.** Sobrevive al
   próximo formato que agregue el backend. *Descartada:* "imagen o Word" — envejece y obliga a
   reescribir cada texto en cada formato nuevo.

7. **El ícono del archivo cargado depende del tipo (`description` / `image`).** Confirma de un
   vistazo qué se subió, sin costo de layout. *Descartada:* un ícono genérico único
   (`draft`) — pierde la señal que hoy ya da el ícono `image`.

8. **Sin eventos ni dimensiones nuevas de analytics.** Hereda Decisión 21 de
   `contract-analysis`: sin pregunta de producto no se agrega medición. *Descartada:* sumar
   `fileType` al evento — nadie preguntó por la mezcla de formatos.

9. **Los mensajes de validación siguen en `useContractAnalysis.ts`; no se mudan al módulo de
   constantes.** Hereda Decisión 18 de `rag-domain-metadata`: no hay refactor estructural sin
   pedido. *Descartada:* mudarlos — churn de imports sobre 15 escenarios verdes.

10. **Se conserva `IDLE_STEP_1_TEXT` tal cual.** Ya es neutral y describe con precisión lo que
    pasa con ambos formatos. *Descartada:* reescribirlo por simetría con el título — cambia un
    texto correcto y obliga a tocar un test que hoy pasa.

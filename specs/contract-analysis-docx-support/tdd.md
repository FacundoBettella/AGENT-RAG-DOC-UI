# contract-analysis-docx-support — tdd.md

**Modo:** test-after (indicado por el `tech-lead`; también anotado en `feature_list.json` como
`"mode": "test-after"`).

Se implementó primero el delta de producción: en `src/hooks/useContractAnalysis.ts`, rename
`MAX_IMAGE_SIZE_BYTES` → `MAX_FILE_SIZE_BYTES` (mismo valor), `VALID_EXTENSIONS` suma `.docx` y
los mensajes `UNSUPPORTED_FORMAT_MESSAGE`/`FILE_TOO_LARGE_MESSAGE` pasan a redacción neutral; en
`src/features/ContractAnalysis/ContractAnalysis.constants.ts`, `DROPZONE_INSTRUCTIONS`,
`DROPZONE_HINT`, `FILE_INPUT_ACCEPT`, `IDLE_SUBTITLE`, `IDLE_STEP_1_TITLE` y `LOADING_NOTE` pasan a
copia neutral respecto del formato (`IDLE_STEP_1_TEXT` se dejó sin cambios, ya era neutral —
Decisión 10 de la spec); y en
`src/features/ContractAnalysis/components/FileDropzone/FileDropzone.tsx` se agregó
`getFileIcon(fileName)` para elegir `description` (`.docx`) o `image` (resto) en el estado "con
archivo", reemplazando el ícono `image` fijo que había antes. No se tocó `docAgentService.ts`
(campos `original_image`/`amendment_image` sin cambios) ni el layout/estructura de la pantalla.

Después se adaptaron los escenarios existentes de `tests/ContractAnalysis.test.tsx` que assertaban
la copia vieja (`@s5`, `@s6`, `@s8`, `@s9`, `@s10` de la feature 12, `contract-analysis.feature`) y
se agregaron los 5 escenarios nuevos de esta feature (`@s1`-`@s5` de
`contract-analysis-docx-support.feature`). Cada test nuevo o modificado que ejercita
comportamiento propio de esta feature se verificó a mano rompiendo la implementación
correspondiente (ver "Verificación de mordida") antes de dejarlo asentado. `tests/DocAgentService.test.ts`
no se tocó (los `detail` de ejemplo con "imagen" son strings del backend simulado, no copia de esta UI).

## Escenarios existentes ajustados (feature 12, `contract-analysis.feature`)

| Escenario | Ajuste | Test | Archivo |
|---|---|---|---|
| `@s5` Rechaza extensión no soportada sin reemplazar el archivo válido ya cargado | mensaje esperado → `'Formato no soportado. Subí un archivo .png, .jpg, .jpeg o .docx.'` | `ContractAnalysis — @s5` | `tests/ContractAnalysis.test.tsx` |
| `@s6` Rechaza una imagen que supera los 10 MB | mensaje esperado → `'El archivo supera el límite de 10 MB.'` | `ContractAnalysis — @s6` | `tests/ContractAnalysis.test.tsx` |
| `@s8` El error inline de una dropzone se limpia al aceptar un archivo válido | mensaje esperado → `'El archivo supera el límite de 10 MB.'` | `ContractAnalysis — @s8` | `tests/ContractAnalysis.test.tsx` |
| `@s9` Estado inicial (idle) | texto esperado → `'01 Lectura de los documentos'` | `ContractAnalysis — @s9` | `tests/ContractAnalysis.test.tsx` |
| `@s10` Estado de carga | texto esperado → `'Puede tardar hasta un minuto: se leen los dos documentos y después se comparan.'` | `ContractAnalysis — @s10` | `tests/ContractAnalysis.test.tsx` |

## Mapa `@s → test` (`features/contract-analysis-docx-support.feature`)

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` Acepta un archivo .docx válido en la dropzone | `ContractAnalysis — @s1 Acepta un archivo .docx válido en la dropzone` | `tests/ContractAnalysis.test.tsx` |
| `@s2` El ícono del archivo cargado depende del tipo, y original y enmienda pueden ser de tipos distintos | `ContractAnalysis — @s2 El ícono del archivo cargado depende del tipo...` | `tests/ContractAnalysis.test.tsx` |
| `@s3` Rechaza un archivo .doc legado con el mensaje de error actualizado | `ContractAnalysis — @s3 Rechaza un archivo .doc legado con el mensaje de error actualizado` | `tests/ContractAnalysis.test.tsx` |
| `@s4` El límite de 10 MB también aplica a los archivos .docx | `ContractAnalysis — @s4 El límite de 10 MB también aplica a los archivos .docx` | `tests/ContractAnalysis.test.tsx` |
| `@s5` La pista de la dropzone comunica los formatos soportados incluyendo DOCX | `ContractAnalysis — @s5 La pista de la dropzone comunica los formatos soportados incluyendo DOCX` | `tests/ContractAnalysis.test.tsx` |

## Verificación de mordida (cada test falla si se rompe la implementación)

Verificado a mano, revirtiendo temporalmente el cambio correspondiente y confirmando el fallo con
`docker compose exec app npx vitest run tests/ContractAnalysis.test.tsx`, y luego revirtiendo la
mutación:

- `@s2`: reemplazar `getFileIcon` en `FileDropzone.tsx` por `return 'image'` fijo → el test de
  `@s2` falla (`expected 'image' to be 'description'`).
- `@s1`/`@s2` (indirecto): quitar `.docx` de `VALID_EXTENSIONS` en `useContractAnalysis.ts` → `@s1`
  falla (`contrato.docx` ya no se carga, aparece el mensaje de formato no soportado) y `@s2` falla
  (el archivo `.docx` no llega a cargarse, el ícono queda en `upload_file`, estado vacío). `@s3`
  (rechazo de `.doc`) no se ve afectado por esta mutación en particular, como corresponde: ya
  rechazaba `.doc` antes de esta feature.
- `@s4`: subir `MAX_FILE_SIZE_BYTES` a `100 * 1024 * 1024` en `useContractAnalysis.ts` → el test de
  `@s4` falla (el `.docx` de 11 MB deja de mostrar el mensaje de límite).
- `@s5`: revertir `DROPZONE_HINT` a `'PNG o JPG (máx. 10 MB)'` en `ContractAnalysis.constants.ts`
  → el test de `@s5` falla (no encuentra el texto nuevo en la dropzone).

## Consecuencias fuera del mapa anterior

- Ningún archivo fuera de `useContractAnalysis.ts`, `ContractAnalysis.constants.ts`,
  `FileDropzone.tsx` y `tests/ContractAnalysis.test.tsx` se modificó. Se confirmó que no existe
  validación cruzada entre `originalFile` y `amendmentFile` en ningún punto del código (ambos se
  validan de forma independiente en `selectOriginal`/`selectAmendment`), consistente con la
  Decisión 5 de la spec.

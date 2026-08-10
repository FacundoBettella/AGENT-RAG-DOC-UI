# contract-analysis — tdd.md

**Modo:** test-after (indicado por el `tech-lead`; también anotado en `feature_list.json` como
`"mode": "test-after"`).

Se implementó primero: la extensión de `extractBackendError` (caso `detail`), el rename
`VITE_API_BASE_URL` → `VITE_RAG_API_BASE_URL` en `hrService.ts`/`ragService.ts`, el nuevo
`docAgentService.analyze` (FormData, URL sin barra final, timeout 180s, validación de payload y
traducción a camelCase), `formatFileSize` mudado a `src/utils/formatFileSize.ts` (con
`useRagForm.ts` reexportándolo para no romper `RagPage`), el hook `useContractAnalysis`, y la
pantalla completa (`ContractAnalysisContainer` → `UploadColumn`/`ResultPanel` → `FileDropzone`)
con el patrón Container + Context. Después se blindó cada escenario aprobado con uno o más tests
concretos en `tests/DocAgentService.test.ts` y `tests/ContractAnalysis.test.tsx`, más los ajustes
de regresión en `tests/ApiIntegration.test.ts` (rename de env var) y `tests/DesignSystemShell.test.tsx`
(el placeholder "Próximamente" de `/contracts` ya no aplica). Cada test crítico se verificó a mano
rompiendo la implementación correspondiente (ver "Verificación de mordida") antes de dejarlo asentado.

## Decisión de diseño no explícita en la spec: el `<input type="file">` queda montado en ambos estados

La spec describe la dropzone como dos estados excluyentes (vacía / con archivo) pero el escenario
`@s5` requiere poder intentar reemplazar un archivo ya cargado con uno inválido sin pasar primero
por "Quitar". Para que eso sea alcanzable desde la UI real (y no solo desde el hook), `FileDropzone`
mantiene el `<label htmlFor>` + `<input>` siempre montados en la misma posición del árbol — solo el
contenido visual interno (ícono+texto vs. fila de archivo) cambia según `file`. El accessible name
del input se fija con `aria-label` directamente sobre el `<input>` (no depende del texto visible del
label, que cambia entre estados), así `getByLabelText` lo resuelve igual en los dos estados.

## Mapa `@s → test` (`features/contract-analysis.feature`)

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` docAgentService.analyze arma el FormData, pega a `/analysis` sin barra final y traduce a camelCase | `docAgentService — @s1` (3 tests: URL/config, campos del FormData, resolución camelCase) | `tests/DocAgentService.test.ts` |
| `@s2` docAgentService.analyze lanza Error si el payload no cumple el contrato mínimo | `docAgentService — @s2` (4 tests: `sections_changed` vacío, solo strings vacíos, `summary` vacío, `topics_touched` vacío) | `tests/DocAgentService.test.ts` |
| `@s3` extractBackendError devuelve `response.data.detail` cuando es string no vacío | `extractBackendError — @s3` | `tests/DocAgentService.test.ts` |
| `@s4` El 422 de FastAPI con `detail` array cae al mensaje genérico (null) | `extractBackendError — @s4` | `tests/DocAgentService.test.ts` |
| `@s5` Rechaza extensión no soportada sin reemplazar el archivo válido ya cargado | `ContractAnalysis — @s5` | `tests/ContractAnalysis.test.tsx` |
| `@s6` Rechaza una imagen que supera los 10 MB | `ContractAnalysis — @s6` | `tests/ContractAnalysis.test.tsx` |
| `@s7` El botón "Analizar documentos" permanece deshabilitado con un solo archivo | `ContractAnalysis — @s7` | `tests/ContractAnalysis.test.tsx` |
| `@s8` El error inline de una dropzone se limpia al aceptar un archivo válido | `ContractAnalysis — @s8` | `tests/ContractAnalysis.test.tsx` |
| `@s9` Estado inicial (idle): región `aria-live="polite"`, título y dos pasos | `ContractAnalysis — @s9` | `tests/ContractAnalysis.test.tsx` |
| `@s10` Estado de carga: spinner, texto fijo, sin barra de progreso, botón "Analizando…" deshabilitado | `ContractAnalysis — @s10` | `tests/ContractAnalysis.test.tsx` |
| `@s11` Estado de error: mensaje del backend y botón "Reintentar" | `ContractAnalysis — @s11` | `tests/ContractAnalysis.test.tsx` |
| `@s12` "Reintentar" reenvía el análisis con los mismos dos archivos | `ContractAnalysis — @s12` | `tests/ContractAnalysis.test.tsx` |
| `@s13` Estado de éxito: resumen antes que las listas, archivos persisten, se registra analytics | `ContractAnalysis — @s13` (3 tests: orden DOM, dropzones persisten, `trackEvent` con payload) | `tests/ContractAnalysis.test.tsx` |
| `@s14` Reemplazar un archivo tras el éxito no borra el resultado visible | `ContractAnalysis — @s14` | `tests/ContractAnalysis.test.tsx` |
| `@s15` Enviar un nuevo análisis descarta el resultado o error anterior | `ContractAnalysis — @s15` (UI) + `ContractAnalysis — @s15 (hook)` (verifica `result`/`error` en `null` apenas arranca `submit()`, invariante de la spec no observable solo desde `ResultPanel`) | `tests/ContractAnalysis.test.tsx` |

## Cobertura adicional (no mapeada 1:1 a un `@s`, documentada por transparencia)

| Cobertura | Test | Archivo |
|---|---|---|
| Errores HTTP de `docAgentService.analyze` usan `extractBackendError`, con fallback al mensaje genérico ante error de red sin body | `docAgentService — errores HTTP usan extractBackendError…` (2 tests) | `tests/DocAgentService.test.ts` |
| Drag & drop carga un archivo válido y resalta/revierte el borde (paridad con `rag-form-v2`, Decisión 16) | `ContractAnalysis — drag & drop carga un archivo válido` (2 tests) | `tests/ContractAnalysis.test.tsx` |
| Rename `VITE_API_BASE_URL` → `VITE_RAG_API_BASE_URL` no rompe ningún escenario de `hrService`/`ragService` | Todo `tests/ApiIntegration.test.ts` (24 ocurrencias renombradas, sin cambio de comportamiento) | `tests/ApiIntegration.test.ts` |
| `/contracts` deja de mostrar el placeholder "Próximamente" (feature 10) | Ajuste: se eliminó esa aserción de `design-system-shell — @s2`; la ruta `/settings` sigue cubierta | `tests/DesignSystemShell.test.tsx` |

## Verificación de mordida (cada test falla si se rompe la implementación)

Verificado a mano, revirtiendo temporalmente el cambio correspondiente y confirmando el fallo, y
luego revirtiendo la mutación:

- `@s3`/errores HTTP: comentar la rama `detail` en `extractBackendError` (`httpError.ts`) → 2 tests
  de `tests/DocAgentService.test.ts` fallan (`retorna el string de detail`, `rechaza con el mensaje
  detail del backend ante un error HTTP`).
- `@s2`: reemplazar la condición de validación del payload por `if (false)` en
  `parseContractAnalysis` (`docAgentService.ts`) → los 4 tests de `docAgentService — @s2` fallan
  (la promesa resuelve en vez de rechazar).
- `@s6`/`@s8`: reemplazar `file.size > MAX_IMAGE_SIZE_BYTES` por `false` en `validateFile`
  (`useContractAnalysis.ts`) → 2 tests fallan (`@s6` y `@s8`, el mensaje de 10 MB no aparece).
- `@s7`/`@s10`: reemplazar `canSubmit` por `true` (`useContractAnalysis.ts`) → 2 tests fallan (el
  botón deja de estar deshabilitado sin archivos, y deja de mostrar "Analizando…" deshabilitado
  durante `loading`).
- `@s13`: invertir el orden de las secciones "Resumen del cambio" y "Secciones modificadas" en
  `ResultPanel.tsx` → el test de orden DOM (`compareDocumentPosition`) falla.
- `@s15` (hook): quitar `setResult(null)` de `runAnalysis` (`useContractAnalysis.ts`) → el test de
  `ContractAnalysis — @s15 (hook)` falla (`result` no vuelve a `null` apenas arranca el segundo
  `submit()`); este mutante no es visible desde la UI porque `ResultPanel` solo renderiza el bloque
  de éxito cuando `status === 'success'`, de ahí que se agregara el test a nivel de hook además del
  de pantalla.

## Consecuencias fuera del mapa anterior

- `src/hooks/useRagForm.ts` reexporta `formatFileSize` desde `src/utils/formatFileSize.ts` para que
  `RagPage.tsx` (`import { useRagForm, formatFileSize } from '../hooks/useRagForm'`) siga
  compilando sin tocar esa página, que está fuera de alcance de esta feature.
- `README.md` documenta `VITE_RAG_API_BASE_URL` y `VITE_DOC_AGENT_API_BASE_URL` en una sección
  nueva "Variables De Entorno"; no había ninguna documentada antes.
- `features/api-integration.feature` (feature 5, `done`) sigue mencionando `VITE_API_BASE_URL` en
  su texto Gherkin — no se tocó por estar fuera del alcance declarado en `specs/contract-analysis/spec.md`
  (el rename ahí es solo de código y tests, no reabre el contrato ya aprobado de esa feature).

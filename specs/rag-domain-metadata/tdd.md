# rag-domain-metadata — tdd.md

**Modo:** test-after (indicado por el `tech-lead`; también anotado en `feature_list.json` como
`"mode": "test-after"`).

Se implementó primero: `API_ROUTES.INGEST = '/api/ingest'` en `src/constants/apiRoutes.ts`;
`ragService.upload(files, domain)` reescrito con la firma nueva (`RagDomain`, `IngestResult`,
body `{ domain, documents }`, traducción snake_case → camelCase, validación del payload mínimo
con `Error` si `chunks_indexed`/`documents_received` no son finitos ≥ 0, `total_in_store`
ausente → `0`, `domain` tomado del parámetro enviado y no del que vuelve, `extractBackendError`
reusado sin cambios); `useRagForm.ts` ampliado con `domain`/`setDomain`/`result`/`canSubmit`
(`files.length > 0 && validationError === null && domain !== null && status !== 'loading'`), y
con el tracking de analytics reconectado ahí mismo (`rag_files_selected` disparado desde
`addFiles` con el lote aceptado en esa llamada, `rag_form_submitted` disparado en `doSubmit` tras
un éxito, con `domain` sumado al payload); `src/hooks/useRagUpload.ts` eliminado (código muerto,
no montado por ninguna página); `RagPage.tsx` retematizado 1:1 a Tailwind/MD3 (mismos elementos,
mismo orden, mismos roles/`aria-*`/`data-*`, `RagPage.styles.ts` eliminado) con el nuevo
`<fieldset>` de selección de dominio (tres radios nativos con apariencia de pills vía
`peer`/`peer-checked` manual con clases condicionales, sin preselección, deshabilitados por el
`disabled` nativo del `fieldset` durante `status === 'loading'`) y el mensaje de éxito armado con
los datos reales de `IngestResult` (`buildSuccessMessage` en el nuevo `RagPage.constants.ts`, con
singular/plural de "archivo"/"fragmento" y sin duplicar el punto final cuando el label del
dominio ya termina en uno, como "RR.HH."). El componente de página pasó de `function RagPage()` a
`export const RagPage = () =>` para cumplir la convención de arrow function (Decisión de
`docs/conventions.md`, no del contrato de esta feature, pero exigida al reescribir el archivo
completo).

Después se blindó cada uno de los 6 escenarios de `features/rag-domain-metadata.feature` con
tests concretos, se ajustaron los 3 escenarios reescritos de `features/rag-form-v2.feature`
(`@s17`-`@s19`) y los 3 de `features/api-integration.feature` (`@s7`, `@s9`, `@s10`), y se
migraron `tests/analyticsHooks.test.ts` y `tests/RagForm.test.tsx` de `useRagUpload` a
`useRagForm`. Los tests críticos se verificaron a mano rompiendo la implementación
correspondiente (ver "Verificación de mordida") antes de dejarlos asentados.

## Desvío respecto de la instrucción de alcance (documentado, no un cambio de contrato)

La consigna de la tarea decía que solo 3 escenarios de `rag-form-v2.feature` (`@s17`-`@s19`)
necesitaban "un dominio elegido antes" en el test. En la práctica, `canSubmit` ahora exige
`domain !== null` además de `files.length > 0`, así que **todo** assert de "el botón está
habilitado" en `tests/RagFormV2.test.tsx` y `tests/RagForm.test.tsx` (`@s3`, `@s4`, `@s8`, `@s11`,
`@s23` de `rag-form-v2`; `@s4` de `rag-form`) — y también los tests que llegan a hacer clic real
en "Subir archivos" para llegar a un estado de carga (`@s21`, `@s22` de `rag-form-v2`, además de
`@s17`-`@s19`) — necesitaron agregar una selección de dominio en el setup para seguir verificando
lo mismo que verificaban antes. Ningún texto de `.feature` se tocó fuera de lo ya aprobado
(`@s17`-`@s19` de `rag-form-v2.feature`, `@s7`/`@s9`/`@s10` de `api-integration.feature`); el
ajuste fue exclusivamente en el `Given`/setup interno de los tests, para que seguros reflejaran
el contrato real de `canSubmit` de `specs/rag-domain-metadata/spec.md`.

## Mapa `@s → test` (`features/rag-domain-metadata.feature`)

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` `ragService.upload` arma `{ domain, documents }`, pega a `/api/ingest` y traduce la respuesta a camelCase | `rag-domain-metadata @s1: … > envía el body con el dominio pasado como parámetro y resuelve el IngestResult traducido` | `tests/ApiIntegration.test.ts` |
| `@s2` `ragService.upload` lanza `Error` si el payload de respuesta no cumple el contrato mínimo | `rag-domain-metadata @s2: … > rechaza con Error cuando chunks_indexed no es numérico` / `… documents_received es negativo` | `tests/ApiIntegration.test.ts` |
| `@s3` El selector de dominio se muestra como fieldset con tres opciones, ninguna preseleccionada | `rag-domain-metadata — @s3 …` (4 tests: fieldset con leyenda, texto de ayuda, tres radios con label, ninguno marcado) | `tests/RagFormV2.test.tsx` |
| `@s4` El botón permanece deshabilitado sin dominio elegido aunque haya archivos válidos, y se habilita al elegir uno | `rag-domain-metadata — @s4 …` (2 tests: deshabilitado sin dominio, habilitado tras elegir "Tecnología") | `tests/RagFormV2.test.tsx` |
| `@s5` El selector de dominio se deshabilita durante la carga | `rag-domain-metadata — @s5 … > las tres opciones del selector quedan deshabilitadas mientras status es "loading"` | `tests/RagFormV2.test.tsx` |
| `@s6` Tras un envío exitoso el dominio elegido se conserva y el mensaje de éxito usa los datos reales | `rag-domain-metadata — @s6 … > muestra el mensaje "Se indexaron 57 fragmentos de 3 archivos en la base de RR.HH." y conserva la selección` | `tests/RagFormV2.test.tsx` |

## Escenarios ajustados de features ya aprobadas

| Escenario | Ajuste | Test | Archivo |
|---|---|---|---|
| `rag-form-v2 @s17` Envío exitoso muestra feedback y limpia el formulario | `mockedUpload` resuelve `IngestResult`, dominio elegido antes del submit, assert de éxito por `/se indexaron/i` en vez de `/correctamente/i` | `RagFormV2 — @s17 Envío exitoso` (4 tests) | `tests/RagFormV2.test.tsx` |
| `rag-form-v2 @s18` Error del backend con botón Reintentar | Dominio elegido antes del submit | `RagFormV2 — @s18 …` (3 tests) | `tests/RagFormV2.test.tsx` |
| `rag-form-v2 @s19` Reintentar reenvía los mismos archivos | Dominio elegido antes del submit, `mockedUpload` resuelve `IngestResult` | `RagFormV2 — @s19 …` (2 tests) | `tests/RagFormV2.test.tsx` |
| `api-integration @s7` `ragService.upload` envía `POST /api/ingest` con `{ domain, documents }` | Body y assert incluyen `domain` | `ragService — @s7: envía POST /api/ingest con el body { domain, documents }` | `tests/ApiIntegration.test.ts` |
| `api-integration @s9` `ragService.upload` ya no resuelve `void`: resuelve con el `IngestResult` traducido | Mock con `ingest_result` válido, assert de objeto (no `undefined`) con los 4 campos | `ragService — @s9: ya no resuelve (void): resuelve con el IngestResult traducido` | `tests/ApiIntegration.test.ts` |
| `api-integration @s10` `ragService.upload` lanza `Error` si la respuesta no trae un `ingest_result` válido | 2 tests: sin `ingest_result` en HTTP 200, y HTTP 204 sin body | `ragService — @s10: lanza Error si la respuesta no trae un ingest_result válido` | `tests/ApiIntegration.test.ts` |

## Cobertura adicional (no mapeada 1:1 a un `@s`, documentada por transparencia)

| Cobertura | Test | Archivo |
|---|---|---|
| `ragService.upload` sigue leyendo cada archivo con `FileReader`/`.text()` y arma `documents` en orden, ahora con `domain` en el body (`@s8`, `@s11`-`@s15` no cambiaron de comportamiento, solo de firma) | `ragService — @s8`, `@s11`-`@s15` (ya existentes, actualizados solo para pasar `domain` como segundo argumento) | `tests/ApiIntegration.test.ts` |
| `rag_files_selected` se dispara desde `useRagForm.addFiles` con el lote de archivos aceptados en esa llamada (reapuntado de `useRagUpload.setFiles`) | `useRagForm — @s4: rag_files_selected al seleccionar archivos` | `tests/analyticsHooks.test.ts` |
| `rag_form_submitted` se dispara desde `useRagForm.submit`/`doSubmit` con `domain` sumado al payload (reapuntado de `useRagUpload.submit`) | `useRagForm — @s5: rag_form_submitted al completar ingesta exitosamente` | `tests/analyticsHooks.test.ts` |
| `useRagForm.submit()` no llama al servicio si falta el dominio, aunque haya archivos válidos (guard de `canSubmit`, antes solo se guardaba contra archivos vacíos) | `useRagForm — guard: submit no actúa sin archivos ni dominio` (3 tests: sin nada, con dominio sin archivos, con archivos sin dominio) | `tests/RagForm.test.tsx` |
| El texto explicativo original de `/rag` y el texto de ayuda del nuevo fieldset conviven sin romper el assert original sobre "index" | `RagForm — @s1 …` (ajustado a `getAllByText`) | `tests/RagForm.test.tsx` |

## Verificación de mordida (cada test falla si se rompe la implementación)

Verificado a mano, rompiendo temporalmente el código correspondiente, confirmando el fallo con
`vitest run`, y revirtiendo la mutación antes de continuar:

- `@s4` (botón deshabilitado sin dominio): en `useRagForm.ts`, quitar `domain !== null &&` de
  `canSubmit` → los 2 tests de `rag-domain-metadata — @s4` fallan (el botón queda habilitado con
  solo archivos, sin dominio elegido).
- `@s5` (selector deshabilitado durante la carga): en `RagPage.tsx`, cambiar
  `<fieldset disabled={isLoading}>` por `<fieldset disabled={false}>` → el test de `@s5` falla,
  los radios ya no están deshabilitados durante `status === 'loading'`.
- `@s6` (mensaje de éxito con datos reales): en `RagPage.constants.ts`, reemplazar el cuerpo de
  `buildSuccessMessage` por un mensaje genérico fijo → el test de `@s6` falla, no encuentra el
  texto `"Se indexaron 57 fragmentos de 3 archivos en la base de RR.HH."`.
- `@s1` (domain se toma del parámetro enviado, no del que vuelve en la respuesta): en
  `ragService.ts`, cambiar `parseIngestResult(domain, payload)` por
  `parseIngestResult('hr', payload)` → el test de `@s1` falla, `result.domain` es `'hr'` en vez
  de `'tech'` (el dominio con el que se llamó a `upload`).
- `@s2` (payload inválido lanza `Error`): en `ragService.ts`, reemplazar la condición de
  `parseIngestResult` por `if (false)` → los 2 tests de `rag-domain-metadata — @s2` fallan (la
  promesa resuelve con `chunksIndexed: 'cuarenta'` / `documentsReceived: -1` en vez de rechazar).

## Consecuencias fuera del mapa anterior

- `src/pages/RagPage.styles.ts` se eliminó; ningún otro archivo lo importaba (confirmado con
  `grep` antes de borrar), así que no quedó código muerto colgando de la eliminación.
- `RagPage` pasó de `function RagPage()` a `export const RagPage = () =>` (arrow function,
  `docs/conventions.md`); el `export default RagPage` al final del archivo no cambió, así que
  `import RagPage from '../src/pages/RagPage'` en `App.tsx` y en los tests siguió funcionando sin
  tocarlos.
- El ícono de la zona de carga pasó del emoji `📂` a un ícono de Material Symbols
  (`upload_file`), consistente con el resto de los íconos usados en la app tras
  `design-system-shell`; el elemento conserva el mismo `role="img"` y `aria-label="ícono de
  carga"` que tenía antes, así que ningún test lo asume por su glifo.
- `tests/RagFormV2.test.tsx` sigue siendo el archivo de referencia de `RagPage`; no se creó un
  archivo nuevo para las 6 escenas de esta feature (`spec.md` lo anticipa explícitamente: "la
  pantalla ya tiene el suyo").

# prompts-config — tdd.md

**Modo:** test-after (indicado por el `tech-lead`; también anotado en `feature_list.json` como
`"mode": "test-after"`).

Se implementó primero: `getDocAgentBaseUrl()` extraído a `src/services/docAgentBaseUrl.ts`
(`docAgentService.ts` pasa a importarlo, sin cambio de comportamiento), el nuevo
`promptsService` (`list`/`update`, URLs sin barra final, `timeout: 15_000`, validación de
payload y traducción a camelCase, `extractBackendError` reusado sin modificar), el evento
`'prompt_saved'` en `analyticsService`, el hook `usePromptsConfig` (estado por agente,
`confirmingAgent` único, flujo de guardado en dos pasos `requestSave`/`confirmSave`/
`cancelSave`), y la pantalla completa (`PromptsConfigContainer` → `PromptList` → `PromptCard` +
`ConfirmSaveModal`) con el patrón Container + Context, montada en `SettingsPage.tsx` en
reemplazo del placeholder "Próximamente". El modal es un overlay propio con `role="dialog"`
(foco inicial, `Escape`, ciclo de `Tab` y retorno de foco hechos a mano), no `<dialog>` nativo,
porque el `jsdom@29.1.1` del proyecto no implementa `showModal()`/`close()` (Decisión 21 de
`specs/prompts-config/spec.md`, verificado antes de escribir el componente).

Después se blindó cada escenario aprobado con uno o más tests concretos en
`tests/PromptsConfig.test.tsx` y se cubrió el contrato de `promptsService` en
`tests/PromptsService.test.ts`. Se ajustó `tests/DesignSystemShell.test.tsx` (`@s2`: `/settings`
deja de mostrar "Próximamente"). Los tests críticos de orden temporal, validación e instancia
única de modal se verificaron a mano rompiendo la implementación correspondiente (ver
"Verificación de mordida") antes de dejarlos asentados.

## Mapa `@s → test` (`features/prompts-config.feature`)

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` Carga inicial — una card por agente, en el orden recibido, sin asumir los dos nombres conocidos | `PromptsConfig — @s1 … > muestra tres cards en el orden del backend, con label conocido y label derivado para el desconocido` | `tests/PromptsConfig.test.tsx` |
| `@s2` Error al cargar los prompts — bloque de error con mensaje y botón "Reintentar" | `PromptsConfig — @s2 … > muestra el mensaje de error, el botón Reintentar, y ninguna card` | `tests/PromptsConfig.test.tsx` |
| `@s3` Editar el textarea marca la card como "Sin guardar" y habilita "Guardar cambios" | `PromptsConfig — @s3 … > aparece el badge, se habilita Guardar cambios y aparece Descartar cambios` | `tests/PromptsConfig.test.tsx` |
| `@s4` "Descartar cambios" revierte el textarea al último valor guardado | `PromptsConfig — @s4 … > el textarea vuelve al valor guardado y desaparecen el badge y el botón` | `tests/PromptsConfig.test.tsx` |
| `@s5` Un borrador vacío o con solo espacios deja "Guardar cambios" deshabilitado | `PromptsConfig — @s5 … > el botón queda deshabilitado y muestra el mensaje de validación` | `tests/PromptsConfig.test.tsx` |
| `@s6` "Guardar cambios" abre el modal de confirmación sin disparar el PUT, como instancia única compartida entre las cards | `PromptsConfig — @s6 … > muestra un único modal, no llama a update, foco en Cancelar, y no toca la otra card` | `tests/PromptsConfig.test.tsx` |
| `@s7` Cerrar el modal sin confirmar no dispara el PUT ni altera el borrador, y devuelve el foco a quien lo abrió | `PromptsConfig — @s7 …` (3 tests: `con el botón "Cancelar"`, `con la tecla Escape`, `con un clic en el backdrop`) | `tests/PromptsConfig.test.tsx` |
| `@s8` Confirmar ("Sobrescribir") cierra el modal, registra el analytics antes del request y actualiza el baseline con la respuesta del backend | `PromptsConfig — @s8 … > el orden de efectos es: analytics -> cierre del modal -> PUT -> baseline actualizado` | `tests/PromptsConfig.test.tsx` |
| `@s9` Error al guardar — feedback inline con aria-live después de cerrar el modal, borrador intacto | `PromptsConfig — @s9 … > muestra el error en un bloque, conserva el borrador y el badge "Sin guardar"` | `tests/PromptsConfig.test.tsx` |
| `@s10` Reintentar tras un error reusa "Guardar cambios" y vuelve a pasar por el modal, sin bypassear la confirmación | `PromptsConfig — @s10 … > vuelve a abrir el modal, sin llamar a update hasta confirmar` | `tests/PromptsConfig.test.tsx` |

## Cobertura adicional (no mapeada 1:1 a un `@s`, documentada por transparencia)

| Cobertura | Test | Archivo |
|---|---|---|
| `promptsService.list` pega a `/prompts` sin barra final, `timeout: 15_000`, respeta el orden del backend y traduce a camelCase | `promptsService.list — pega a /prompts sin barra final…` (2 tests) | `tests/PromptsService.test.ts` |
| `promptsService.list` lanza `Error` si el payload no cumple el contrato mínimo (array vacío, `agent_name` vacío, `system_prompt` no-string), con fallback genérico ante error de red | `promptsService.list — lanza Error si el payload no cumple el contrato mínimo` (4 tests) | `tests/PromptsService.test.ts` |
| `promptsService.update` arma `PUT /prompts/{agentName}` con `{ system_prompt }` sin recortar el texto, codifica el `agentName` en la URL, y usa `extractBackendError` con fallback genérico | `promptsService.update — PUT /prompts/{agentName}…` (5 tests) | `tests/PromptsService.test.ts` |
| `getDocAgentBaseUrl()` usa `http://localhost:8000` como fallback cuando `VITE_DOC_AGENT_API_BASE_URL` no está definida | `getDocAgentBaseUrl — usa http://localhost:8000 como fallback` | `tests/PromptsService.test.ts` |
| `/settings` deja de mostrar el placeholder "Próximamente" (feature 10) | Ajuste: `design-system-shell — @s2` reescrito a `La ruta "/settings" deja de ser un placeholder (feature prompts-config)`; se agregó mock de `promptsService` al archivo para evitar red real | `tests/DesignSystemShell.test.tsx` |

## Verificación de mordida (cada test falla si se rompe la implementación)

Verificado a mano, rompiendo temporalmente el código correspondiente, confirmando el fallo con
`vitest run`, y revirtiendo la mutación antes de continuar:

- `@s8` (orden de efectos): en `usePromptsConfig.ts`, mover la llamada a
  `analyticsService.trackEvent('prompt_saved', …)` de antes del `promptsService.update(...)` a
  dentro del callback `.then(result => …)` (después de que resuelve el request) → el test de
  `@s8` falla: `expect(mockedTrackEvent).toHaveBeenCalledWith(...)` no encuentra la llamada
  porque en el punto en que se hace la aserción (antes de `resolveUpdate(...)`) `trackEvent`
  todavía no se disparó. Esto confirma que el test realmente ata el evento al momento de
  confirmar, no al de resolver la promesa.
- `@s1` (label derivado de agentes desconocidos): en `PromptsConfig.constants.ts`, quitar el
  `charAt(0).toUpperCase()` de `getAgentLabel` (dejar solo el reemplazo de `_` por espacio) →
  el test de `@s1` falla esperando `"Review agent"` y recibiendo `"review agent"`.
- `@s6` (modal como instancia única gobernada por `confirmingAgent`): en `PromptList.tsx`,
  forzar `confirmingEditor = null` en vez de buscarlo en `editors` → el test de `@s6` falla,
  `screen.getAllByRole('dialog')` no encuentra ningún elemento (`TestingLibraryElementError`).
- `@s7` (tecla Escape): en `ConfirmSaveModal.tsx`, cambiar la comparación `event.key === 'Escape'`
  por `event.key === 'EscapeXX'` → sólo el sub-test `con la tecla Escape` de `@s7` falla (el
  modal sigue en el DOM); los otros dos sub-tests (`Cancelar`, backdrop) siguen en verde, lo que
  confirma que cada camino de cierre está probado de forma independiente.
- `@s5` (borrador en blanco deshabilita "Guardar cambios"): en `usePromptsConfig.ts`, quitar
  la condición `state.draft.trim() !== ''` de `canSaveState` → el test de `@s5` falla, el botón
  ya no queda deshabilitado con `'   '` como borrador.
- Soporte de `promptsService` (validación de payload): en `promptsService.ts`, reemplazar la
  condición de `parseAgentPrompt` por `if (false)` → 2 tests de
  `promptsService.list — lanza Error si el payload no cumple el contrato mínimo` fallan (la
  promesa resuelve con `agentName: ''` / `systemPrompt: null` en vez de rechazar).

## Consecuencias fuera del mapa anterior

- `docAgentService.ts` importa `getDocAgentBaseUrl()` desde el nuevo `docAgentBaseUrl.ts` en vez
  de leer `import.meta.env.VITE_DOC_AGENT_API_BASE_URL` inline; la lectura sigue ocurriendo
  dentro de la función (no en scope de módulo), así que `tests/DocAgentService.test.ts` no
  requirió ningún cambio (confirmado corriendo la suite completa en verde).
- Cada card (`PromptCard`) es una región accesible (`<section aria-labelledby>`), lo que permite
  escopar los tests con `within(screen.getByRole('region', { name: <label> }))` sin recurrir a
  `data-testid`.

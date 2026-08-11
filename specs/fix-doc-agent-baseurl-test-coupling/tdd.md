# fix-doc-agent-baseurl-test-coupling — tdd.md

**Modo:** test-after

Feature de un solo archivo de test, sin cambios en `src/`. El código de producción
(`docAgentBaseUrl.ts`, `promptsService.ts`) ya era correcto — el bug vivía en el test.

## Implementación

1. `tests/PromptsService.test.ts:5` — se agregó `vi.mock('../src/services/docAgentBaseUrl', {
   spy: true })` a nivel de archivo, junto al `vi.mock('axios')` existente.
2. Se reescribió el bloque de las líneas 184-200 (comentario de sección + `describe`/`it`):
   se eliminó el `describe('getDocAgentBaseUrl — usa http://localhost:8000 como fallback', …)`
   que asserteaba el literal `'http://localhost:8000/prompts'` sin `vi.stubEnv`, y se reemplazó
   por `describe('promptsService construye la URL con getDocAgentBaseUrl(), sea cual sea el
   entorno', …)`. El test nuevo:
   - toma `getDocAgentBaseUrl` y `promptsService` con dos `import()` dinámicos consecutivos, sin
     `resetModules` entre medio, para que ambos módulos vean la misma instancia espiada;
   - assertea `vi.mocked(getDocAgentBaseUrl)` fue llamada exactamente una vez;
   - assertea que la URL del `axios.get` mockeado es `` `${spy.mock.results[0].value}/prompts` ``
     — derivada del propio spy, sin ningún literal de host/puerto.
3. `specs/prompts-config/tdd.md:48` — la fila de trazabilidad que nombraba el test viejo se
   actualizó al nombre nuevo, anotando `(renombrado por feature 16)`.

## Sintaxis de Vitest verificada contra la versión instalada

La spec dejaba abierta la duda de si `vi.mock(path, { spy: true })` está soportado en la
versión real de Vitest del proyecto (no la forma de factory con `importOriginal`, que es la
alternativa). Se verificó **antes de escribir el test**, inspeccionando los `.d.ts` publicados
dentro del contenedor (`docker compose exec -T app`):

- `node_modules/vitest/package.json` → `"version": "4.1.8"`.
- `node_modules/@vitest/mocker/dist/types.d-BjI5eAwu.d.ts` define
  `interface ModuleMockOptions { spy?: boolean }`, y `vi.mock(path: string, factory?:
  ModuleMockFactoryWithHelper | ModuleMockOptions)` acepta ese tipo como segundo argumento.

`{ spy: true }` **sí está soportado** en Vitest 4.1.8. Se usó la sintaxis tal cual la spec la
proponía como primera opción; no hizo falta la forma de factory con `importOriginal`. Sin
desviación respecto a la spec.

## Mapa `@s → test`

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` promptsService.list invoca getDocAgentBaseUrl y arma la URL con el valor que devolvió | `promptsService construye la URL con getDocAgentBaseUrl(), sea cual sea el entorno > invoca getDocAgentBaseUrl y arma la URL con el valor que devolvió` | `tests/PromptsService.test.ts` |

## Verificación de mordida

Verificado a mano en `src/services/promptsService.ts` (mutado y revertido antes de dejar el
código en su estado final; `git diff -- src/services/promptsService.ts` da vacío tras
revertir):

- **Mutante 1** — reemplazar `const BASE_URL = getDocAgentBaseUrl()` por
  `const BASE_URL = 'http://localhost:8000'` (deja de invocar la función). Resultado: el test
  nuevo falla en `expect(spy).toHaveBeenCalledTimes(1)` — `"expected vi.fn() to be called 1
  times, but got 0 times"`. Además, como efecto colateral esperado, el test de soporte
  `promptsService.list — … > llama a axios.get con la URL y config correctos` también falla
  (comparaba contra `'http://doc.mercurial.local/prompts'` vía `vi.stubEnv`), confirmando que
  ningún test del archivo tolera este mutante.
- **Mutante 2** — llamar a `getDocAgentBaseUrl()` pero descartar su retorno (`getDocAgentBaseUrl();
  const BASE_URL = 'http://localhost:8000'`). Resultado: el test nuevo falla en la comparación
  de URL — `expected 'http://localhost:8000/prompts' to be
  'http://host.docker.internal:8000/prompts'` (el entorno de Docker donde se corrió la
  verificación tiene `VITE_DOC_AGENT_API_BASE_URL=http://host.docker.internal:8000`, confirmando
  además, empíricamente, el escenario que motivó esta feature). Esto confirma que la aserción
  ata la URL al **retorno** del spy, no solo a si fue invocado.

Ambos mutantes se revirtieron inmediatamente después de confirmar el fallo.

## Criterio de aceptación verificado

`docker compose exec -T app npx vitest run` dentro del contenedor (`VITE_DOC_AGENT_API_BASE_URL`
efectiva ahí: `http://host.docker.internal:8000`, vía `docker-compose.yml`) →
**268/268 tests verdes**, 16 archivos. Antes del fix, este mismo comando fallaba exactamente en
el test que esta feature reemplaza (confirmado indirectamente por el Mutante 2 de arriba, que
reproduce el mismo tipo de mismatch que el bug original).

`src/` queda byte a byte igual — sin diff en `docAgentBaseUrl.ts`, `promptsService.ts` ni
`docAgentService.ts`.

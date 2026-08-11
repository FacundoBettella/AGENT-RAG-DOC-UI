# fix-doc-agent-baseurl-test-coupling — spec

> Estado: **cerrada**. Sin preguntas abiertas. Lista para destilar Gherkin.
>
> Precedentes: `specs/prompts-config/spec.md` (13) — origen de `docAgentBaseUrl.ts` y del test
> que esta feature corrige. `specs/fix-rag-fallback-port/spec.md` (15) — mismo patrón de bug
> para el RAG AGENT API; su `tdd.md:52-56` ya deja **anotado por escrito** este caso como
> "fuera de alcance" de aquella feature. Esta feature lo cierra, con una solución distinta.

## Propósito

Desacoplar el test de `getDocAgentBaseUrl()` del valor ambiente de `VITE_DOC_AGENT_API_BASE_URL`, verificando que `promptsService` **invoca** la función y usa su retorno, en vez de assertear una URL literal.

## Contrato

### El bug, verificado

`tests/PromptsService.test.ts:188-199` (único test del archivo que **no** llama a `vi.stubEnv`):

```ts
describe('getDocAgentBaseUrl — usa http://localhost:8000 como fallback', () => {
  it('usa el fallback cuando VITE_DOC_AGENT_API_BASE_URL no está definida', async () => {
    …
    const [url] = mockedAxiosGet.mock.calls[0]
    expect(url).toBe('http://localhost:8000/prompts')   // ← literal acoplado al entorno
  })
})
```

El test **no fuerza** el escenario que dice probar. `import.meta.env.VITE_DOC_AGENT_API_BASE_URL`
sí está definida en el proceso de `vitest`, y el resultado depende de cuánto valga:

| Entorno | De dónde sale la env var | Valor efectivo | Resultado del test |
|---|---|---|---|
| Local (host) | `.env.local:2` — `VITE_DOC_AGENT_API_BASE_URL=http://localhost:8000` | `http://localhost:8000` | Pasa **por casualidad**: el valor coincide con `DEFAULT_DOC_AGENT_BASE_URL` |
| Docker | `docker-compose.yml:18` — `http://host.docker.internal:8000` (`.env.local` no entra a la imagen: el `Dockerfile` copia solo `index.html`, `tsconfig.json`, `vite.config.ts`, `src/`, `tests/`) | `http://host.docker.internal:8000` | **Falla**: recibido `http://host.docker.internal:8000/prompts` |

Dos consecuencias, ambas reales:

1. **Falso rojo en Docker.** La suite rompe sin que haya un bug de producción — el valor
   `host.docker.internal` es correcto y necesario para la red de contenedores.
2. **El test nunca cubrió lo que declara.** Ni siquiera en local: el camino
   `?? DEFAULT_DOC_AGENT_BASE_URL` no se ejercita cuando la variable está definida. Es el mismo
   hallazgo empírico que documenta `specs/fix-rag-fallback-port/tdd.md:34-50` para el RAG.

Producción (`src/services/docAgentBaseUrl.ts`, `promptsService.ts:34,55`) está **correcta**: el
fallback `http://localhost:8000` es el puerto real del DOC AGENT API y la lectura de
`import.meta.env` está dentro del cuerpo de la función a propósito.

### Cómo se importa hoy (define la técnica de mock)

`promptsService.ts:4` — named import directo de un módulo sin barrel:

```ts
import { getDocAgentBaseUrl } from './docAgentBaseUrl'
```

No es un método de objeto ni un namespace: `vi.spyOn(moduloImportado, 'getDocAgentBaseUrl')`
**no** es aplicable (Vitest 4 no permite redefinir exports de un módulo ESM sin mockearlo
antes). Hace falta interceptar el módulo (Decisión 3).

### El test nuevo

Reemplaza el bloque `tests/PromptsService.test.ts:184-200` (comentario de sección incluido).
No se agregan tests aparte de éste; no se toca ninguno de los 11 restantes del archivo.

**Mock a nivel de archivo**, junto al `vi.mock('axios')` de la línea 4:

```ts
vi.mock('../src/services/docAgentBaseUrl', { spy: true })
```

`{ spy: true }` envuelve cada export en un spy **conservando la implementación real** — los 11
tests que hacen `vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')`
siguen viendo el comportamiento de siempre, porque la función real sigue leyendo
`import.meta.env` en cada llamada. Si el runner no lo soportara, la forma equivalente es una
factory parcial que preserve el original:

```ts
vi.mock('../src/services/docAgentBaseUrl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/docAgentBaseUrl')>()
  return { ...actual, getDocAgentBaseUrl: vi.fn(actual.getDocAgentBaseUrl) }
})
```

**El test:**

```ts
describe('promptsService construye la URL con getDocAgentBaseUrl(), sea cual sea el entorno', () => {
  it('invoca getDocAgentBaseUrl y arma la URL con el valor que devolvió', async () => {
    mockedAxiosGet.mockResolvedValue({
      data: [{ agent_name: 'extraction_agent', system_prompt: 'x' }],
    })

    // Sin resetModules entre estos dos imports: promptsService tiene que recibir
    // exactamente la misma instancia espiada que observa el test.
    const { getDocAgentBaseUrl } = await import('../src/services/docAgentBaseUrl')
    const { promptsService } = await import('../src/services/promptsService')
    await promptsService.list()

    const spy = vi.mocked(getDocAgentBaseUrl)
    expect(spy).toHaveBeenCalledTimes(1)

    const [url] = mockedAxiosGet.mock.calls[0]
    expect(url).toBe(`${spy.mock.results[0].value}/prompts`)
  })
})
```

Restricciones que el test debe respetar (no son adorno):

- **Cero `vi.stubEnv` y cero literales de host/puerto** en este test. Es el criterio de
  aceptación: si aparece uno, el acoplamiento vuelve.
- El `beforeEach` existente (`vi.clearAllMocks()` + `vi.resetModules()`) **no cambia**.
  `clearAllMocks` borra historial de llamadas, no implementaciones: el spy sigue delegando en
  la función real. `resetModules` reinstancia el módulo mockeado, por eso la referencia al spy
  se toma **dentro** del test, después del reset, y nunca en scope de archivo.

### Qué sigue mordiendo (y qué no)

| Mutación | ¿Rompe el test nuevo? |
|---|---|
| `promptsService.list` arma la URL con un literal en vez de llamar a `getDocAgentBaseUrl()` | **Sí** — `toHaveBeenCalledTimes(1)` recibe 0 |
| `list` llama a la función pero descarta su retorno (usa otro valor) | **Sí** — la URL no coincide con `spy.mock.results[0].value` |
| `API_ROUTES.PROMPTS` cambia (`/prompts` → `/prompt`) | **Sí** — la comparación incluye el path |
| `list` llama a `getDocAgentBaseUrl()` dos veces | **Sí** — `toHaveBeenCalledTimes(1)` |
| `DEFAULT_DOC_AGENT_BASE_URL` cambia de valor | **No** — ver "Deuda registrada" |

### Alcance

**Dentro:**

| Archivo | Cambio |
|---|---|
| `tests/PromptsService.test.ts` | Líneas 184-200: el bloque se reescribe según el contrato de arriba. Se agrega el `vi.mock('../src/services/docAgentBaseUrl', { spy: true })` arriba de todo. Los otros 11 tests no se tocan. |
| `specs/prompts-config/tdd.md` | Línea 48: la fila de trazabilidad nombra el test viejo y quedaría colgada. Se actualiza el nombre y se anota "(renombrado por feature 16)". |

**Fuera:**

- **Todo `src/`.** Este bug es del test, no del código. `docAgentBaseUrl.ts`,
  `promptsService.ts` y `docAgentService.ts` quedan byte a byte iguales.
- `.env.local`, `docker-compose.yml:18`, `README.md:296` — los tres tienen el valor correcto
  para su entorno. Nada que corregir.
- `tests/DocAgentService.test.ts` — sus 10 tests stubean `VITE_DOC_AGENT_API_BASE_URL` en
  todos los casos. No tiene la exposición.
- `tests/ApiIntegration.test.ts:485-567` — los 4 tests de la feature 15 ya fuerzan
  `vi.stubEnv('VITE_RAG_API_BASE_URL', undefined)`. No se migran a la técnica del spy
  (Decisión 5).
- Configurar `.env.test` o `env` en `vite.config.ts` para neutralizar el entorno de toda la
  suite (Decisión 6).

### Barrido de verificación (hecho, no pendiente)

- `grep 'localhost'` en `tests/` → **10 ocurrencias**: 2 en `PromptsService.test.ts`
  (líneas 188 y 198, las que corrige esta feature) y 8 en `ApiIntegration.test.ts`, todas
  dentro de tests que stubean la env var explícitamente a `undefined`.
- `grep 'VITE_DOC_AGENT_API_BASE_URL'` en `tests/` → **12 ocurrencias**, todas `vi.stubEnv`
  con un valor concreto salvo la del test roto, que no stubea nada.
- **Conclusión: `tests/PromptsService.test.ts:188-199` es el único caso del patrón en el
  repo.** No hay un segundo sitio que justifique abrir otra feature.

### Criterio de aceptación

El archivo `tests/PromptsService.test.ts` pasa entero, sin cambiar una línea, con
`VITE_DOC_AGENT_API_BASE_URL` valiendo: no definida, `http://localhost:8000`,
`http://host.docker.internal:8000`, o cualquier otro valor. Verificable a mano con
`VITE_DOC_AGENT_API_BASE_URL=http://cualquier.cosa:1234 npx vitest run tests/PromptsService.test.ts`
y con `docker compose run --rm app npx vitest run`.

### Deuda registrada (no se resuelve acá, por decisión del humano)

Tras el fix, el literal `DEFAULT_DOC_AGENT_BASE_URL = 'http://localhost:8000'` queda **sin
ningún test que lo verifique**. No es una regresión de cobertura: hoy tampoco lo verifica —
`.env.local` define la variable, así que la rama del `??` nunca se ejercita (mismo hallazgo que
`specs/fix-rag-fallback-port/tdd.md:43-50`). Si en el futuro se quiere cubrir, la forma es un
test adicional con `vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', undefined)`, como los `@s2`/`@s3`/`@s4`
de la feature 15 — es un test **distinto**, no un reemplazo del de esta feature.

## Decisiones

1. **El test verifica que `getDocAgentBaseUrl()` fue invocada, no el valor de la URL.**
   Decidido por el humano. Alternativa descartada: `vi.stubEnv(…, undefined)` (patrón de la
   feature 15) — arregla el rojo pero mantiene el test atado a un literal de host.

2. **La URL esperada se deriva de `spy.mock.results[0].value`, no de un literal.**
   "Se llamó a la función" solo probaría la llamada; atar la URL al retorno prueba que el
   service **usa** ese valor. Alternativa descartada: assertear únicamente el call count —
   pierde la cobertura del armado de la URL.

3. **Mock del módulo con `vi.mock(path, { spy: true })`, implementación real preservada.**
   `promptsService` importa la función por named import: no hay objeto sobre el cual
   `vi.spyOn`. Alternativa descartada: `vi.spyOn` sobre el namespace ESM — Vitest 4 no lo
   permite sin mockear el módulo primero.

4. **Cero cambios en `src/`.** El bug vive en el test; producción es correcta en ambos
   entornos. Alternativa descartada: hacer el default configurable o inyectable — rediseño de
   producción para acomodar un test mal escrito.

5. **No se migran los tests de la feature 15 a la técnica del spy.** Están verdes en Docker y
   además cubren el literal `8080`, cobertura real que el spy no da. Alternativa descartada:
   unificar la técnica en toda la suite — cambio transversal sin bug que lo motive.

6. **No se neutraliza la env var a nivel de configuración (`.env.test` / `env` en
   `vite.config.ts`).** Escondería el acoplamiento en vez de eliminarlo, y afectaría a los 30+
   tests del repo. Alternativa descartada por alcance: es un cambio de infraestructura de
   testing, no este fix.

7. **Se actualiza la fila de trazabilidad de `specs/prompts-config/tdd.md:48`.** El renombre
   del `describe` deja ese mapeo `@s → test` apuntando a un test inexistente. Alternativa
   descartada: dejarlo colgado y solo anotarlo en el `tdd.md` nuevo — rompe la trazabilidad
   versionada.

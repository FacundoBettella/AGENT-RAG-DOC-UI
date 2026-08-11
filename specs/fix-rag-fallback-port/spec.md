# fix-rag-fallback-port — spec

> Estado: **cerrada**. Sin preguntas abiertas. Lista para destilar Gherkin.
>
> Precedentes: `specs/contract-analysis/spec.md` (12) — introduce la separación de las dos
> base URLs y ya deja anotada esta corrección pendiente (§ "Deuda", línea 390).
> `specs/prompts-config/spec.md` (13) — origen de `docAgentBaseUrl.ts`, el módulo que esta
> feature espeja (Decisión 3 de esa spec). `specs/rag-domain-metadata/spec.md` (14) — última
> feature que tocó `ragService`.

## Propósito

Corregir el fallback de `VITE_RAG_API_BASE_URL`, que apunta al puerto del DOC AGENT API (`8000`) en vez del RAG AGENT API (`8080`), y unificarlo en un módulo espejo de `docAgentBaseUrl.ts`.

## Contrato

### El bug, verificado

| Backend | `docker-compose.yml` del repo | Puerto publicado en el host |
|---|---|---|
| RAG AGENT API (`/api/query`, `/api/ingest`) | `"8080:8000"` | **8080** |
| DOC AGENT API (`/analysis`, `/prompts`) | `"8000:8000"` | 8000 |

`hrService` y `ragService` hablan con el **RAG AGENT API**, pero caen a `8000`. El valor
correcto es `http://localhost:8080`.

Origen: la feature 12 renombró `VITE_API_BASE_URL` → `VITE_RAG_API_BASE_URL` sin tocar el
literal del fallback, que ya venía mal de antes. El literal estaba **duplicado inline en dos
services** y ningún test cubría el camino "sin env var", así que el rename pasó verde. Las
dos causas se atacan acá: el valor (Decisión 1) y la duplicación que lo dejó desincronizarse
(Decisión 2).

### Módulo nuevo: `src/services/ragBaseUrl.ts`

Espejo exacto de `src/services/docAgentBaseUrl.ts` — misma forma, mismo estilo, mismo
comentario explicativo (que documenta una restricción real de testing, no es decorativo):

```ts
const DEFAULT_RAG_BASE_URL = 'http://localhost:8080'

// La lectura de import.meta.env queda dentro de la función (no en scope de módulo) para que
// los stubs de entorno de los tests (vi.stubEnv) sigan surtiendo efecto import a import.
export function getRagBaseUrl(): string {
  return import.meta.env.VITE_RAG_API_BASE_URL ?? DEFAULT_RAG_BASE_URL
}
```

Elementos que se replican del precedente, uno a uno:

- `export function` nombrada (no arrow const): es una función plana, no un componente.
- Retorna `string` plano — no un objeto de config, no una constante exportada.
- La constante del default es **module-private** (no se exporta) y va en `UPPER_SNAKE`.
- **`import.meta.env` se lee dentro del cuerpo de la función**, nunca en scope de módulo.
- Import directo desde el consumidor: `src/services/` **no tiene barrel** hoy y esta feature
  no lo introduce (Decisión 5).

### Cómo lo consumen los services

`hrService.ts:23` y `ragService.ts:44` reemplazan el literal por la llamada, **manteniendo la
llamada dentro del cuerpo de la función async**, en la misma posición donde hoy está la
constante local:

```ts
import { getRagBaseUrl } from './ragBaseUrl'
// …
const BASE_URL = getRagBaseUrl()
```

Es exactamente lo que hacen `promptsService.ts:34,55` y `docAgentService.ts:45`. **Subir la
llamada a scope de módulo rompe los 30 tests existentes** que usan `vi.stubEnv` +
`vi.resetModules()` + `await import(...)`: el valor quedaría congelado en el primer import.

### Alcance

**Dentro:**

| Archivo | Cambio |
|---|---|
| `src/services/ragBaseUrl.ts` | **Nuevo.** El módulo de arriba. |
| `src/services/hrService.ts` | Línea 23: el literal `'http://localhost:8000'` sale; entra `getRagBaseUrl()` + su import. |
| `src/services/ragService.ts` | Línea 44: ídem. |
| `tests/ApiIntegration.test.ts` | **Se agregan** los 2 tests de regresión de Decisión 4. Los 30 tests existentes **no se tocan**. |
| `README.md` | Línea 295: fila `VITE_RAG_API_BASE_URL`, fallback `http://localhost:8000` → `http://localhost:8080`. |

**Fuera:**

- `src/services/docAgentBaseUrl.ts:1` — `DEFAULT_DOC_AGENT_BASE_URL = 'http://localhost:8000'`
  es **correcto** (DOC AGENT API publica 8000). **No se toca**, ni se fusiona con el módulo
  nuevo (Decisión 3). Tampoco cambia su test (`tests/PromptsService.test.ts:188-199`) ni la
  fila de `VITE_DOC_AGENT_API_BASE_URL` en `README.md:296`.
- `.env.local` — ya tiene `VITE_RAG_API_BASE_URL=http://localhost:8080`. Correcto y
  gitignoreado.
- `docker-compose.yml:16` — ya tiene `http://host.docker.internal:8080`. Correcto.
- Barrel `src/services/index.ts` (Decisión 5).
- Mover los defaults a `src/constants/` (Decisión 3).
- Cualquier cambio de comportamiento en `hrService.query` / `ragService.upload`: rutas,
  payloads, parsing y manejo de error quedan idénticos. Las firmas públicas no cambian.

### Barrido de verificación (hecho, no pendiente)

- `grep 'localhost:8000'` en `src/` → **3 ocurrencias**: `hrService.ts:23`,
  `ragService.ts:44` (ambas se van con la extracción) y `docAgentBaseUrl.ts:1` (correcta, no
  se toca). No hay un cuarto sitio con el mismo patrón.
- `grep '8000|8080'` en `tests/` → **2 ocurrencias**, ambas en `PromptsService.test.ts`
  (líneas 188 y 198) y ambas sobre `getDocAgentBaseUrl`. **Ningún test assertea el valor
  viejo del fallback del RAG**: los 30 usos de `vi.stubEnv('VITE_RAG_API_BASE_URL', …)` de
  `tests/ApiIntegration.test.ts` lo fijan siempre en `'http://api.mercurial.local'`, con
  `vi.unstubAllEnvs()` en `afterEach`. Conclusión: **cero tests existentes a corregir**, ni
  por el valor ni por la extracción.
- `src/services/` **no tiene `index.ts`**: `docAgentBaseUrl` se importa por ruta directa.
- `docAgentBaseUrl.ts` **no tiene archivo de test propio** — se verifica a través de su
  consumidor. Eso define dónde van los tests nuevos (Decisión 4).

### Comportamiento observable

Con `VITE_RAG_API_BASE_URL` **no definida**:

- `hrService.query(q)` hace `POST http://localhost:8080/api/query`.
- `ragService.upload(files, domain)` hace `POST http://localhost:8080/api/ingest`.

Con `VITE_RAG_API_BASE_URL` definida: se usa su valor, sin cambios respecto de hoy.

La extracción es **invisible desde afuera**: mismo comportamiento observable con o sin ella.

## Decisiones

1. **El fallback correcto es `http://localhost:8080`.** Verificado contra los `docker-compose.yml`
   de ambos backends, no inferido del nombre de la variable. Alternativa descartada: cambiar
   el puerto publicado del RAG AGENT API a 8000 — chocaría con el DOC AGENT API.

2. **Extraer a `src/services/ragBaseUrl.ts` en esta misma feature** (confirmado con el humano).
   El literal duplicado inline en dos services es la causa mecánica de la desincronización.
   Alternativa descartada: solo corregir los dos literales — deja intacta la trampa que
   produjo el bug.

3. **Dos módulos separados, no uno compartido, y ninguno en `src/constants/`.** Son dos
   backends independientes con defaults distintos; `docAgentBaseUrl.ts` fija el patrón y la
   simetría vale más que la letra de `conventions.md:44-57`. Alternativa descartada: un
   `apiHosts.ts` con ambos defaults — vuelve a atar las dos APIs a un mismo archivo, que es
   lo que la Decisión 4 de `contract-analysis` separó a propósito.

4. **Los 2 tests de regresión van en `tests/ApiIntegration.test.ts`, no en un
   `ragBaseUrl.test.ts` nuevo.** Precedente literal: `docAgentBaseUrl` no tiene test propio;
   se verifica en `tests/PromptsService.test.ts:188` a través de `promptsService.list()`,
   asserteando la URL resultante. Acá: sin `vi.stubEnv`, `hrService.query` debe pegar a
   `http://localhost:8080/api/query` y `ragService.upload` a `.../api/ingest`. Alternativa
   descartada: unit test del helper — testea el `??`, no que el service lo use.

5. **No se introduce barrel en `src/services/`.** Import por ruta directa, como
   `docAgentBaseUrl`. Alternativa descartada: crear `index.ts` — refactor transversal a 6
   módulos y a todos sus imports, ajeno a este fix.

6. **Corregir también `README.md:295`.** La tabla de variables de entorno documenta el
   fallback del RAG como `8000` y quedaría mintiendo tras el fix. Alternativa descartada:
   dejarlo para después — es la misma línea de razonamiento que produjo este bug.

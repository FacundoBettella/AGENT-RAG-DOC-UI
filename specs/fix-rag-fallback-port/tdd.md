# fix-rag-fallback-port — tdd.md

**Modo:** test-after

Feature chica y mecánica: se implementó primero (módulo nuevo + rewire de los dos services +
fix de README) y después se blindó con los 4 tests de `tests/ApiIntegration.test.ts` que
cubren los 4 escenarios de `features/fix-rag-fallback-port.feature`.

## Implementación

1. `src/services/ragBaseUrl.ts` — nuevo. Espejo exacto de `docAgentBaseUrl.ts`:
   `getRagBaseUrl()` retorna `import.meta.env.VITE_RAG_API_BASE_URL ?? DEFAULT_RAG_BASE_URL`,
   con `DEFAULT_RAG_BASE_URL = 'http://localhost:8080'` module-private.
2. `src/services/hrService.ts:23` y `src/services/ragService.ts:44` — el literal inline
   `import.meta.env.VITE_RAG_API_BASE_URL ?? 'http://localhost:8000'` se reemplazó por
   `getRagBaseUrl()`, manteniendo la llamada dentro del cuerpo de la función async (misma
   posición que la constante local original), con el import correspondiente agregado.
3. `README.md:295` — fallback documentado de `VITE_RAG_API_BASE_URL` corregido de
   `http://localhost:8000` a `http://localhost:8080`.

## Mapa @s → test

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` — getRagBaseUrl usa el valor de la env var cuando está definida | `fix-rag-fallback-port @s1: getRagBaseUrl usa el valor de la variable de entorno cuando está definida` | `tests/ApiIntegration.test.ts` |
| `@s2` — getRagBaseUrl usa `http://localhost:8080` como fallback cuando la env var no está definida | `fix-rag-fallback-port @s2: getRagBaseUrl usa http://localhost:8080 como fallback cuando la variable no está definida` | `tests/ApiIntegration.test.ts` |
| `@s3` — hrService.query pega al puerto correcto sin la env var | `fix-rag-fallback-port @s3: hrService.query pega contra el puerto correcto sin la variable de entorno` | `tests/ApiIntegration.test.ts` |
| `@s4` — ragService.upload pega al puerto correcto sin la env var | `fix-rag-fallback-port @s4: ragService.upload pega contra el puerto correcto sin la variable de entorno` | `tests/ApiIntegration.test.ts` |

Los tests se verifican indirecto a través de `hrService` y `ragService` (los consumidores),
no con un `ragBaseUrl.test.ts` propio — mismo patrón que `docAgentBaseUrl.ts`, que tampoco
tiene test dedicado (Decisión 4 de `specs/fix-rag-fallback-port/spec.md`).

## Hallazgo durante la verificación de mordida

`.env.local` (gitignoreado, presente en este entorno) define
`VITE_RAG_API_BASE_URL=http://localhost:8080`, y ese valor llega a `import.meta.env` también
en el proceso de `vitest` — no solo en dev/build. Eso significa que un test de `@s2`/`@s3`/`@s4`
que simplemente **no llama** a `vi.stubEnv` no ejercita la rama del fallback
(`DEFAULT_RAG_BASE_URL`): usa el valor real de `.env.local`, que hoy coincide numéricamente
con el fallback correcto (8080) pero no lo estaría probando.

Se confirmó esto empíricamente: al mutar `DEFAULT_RAG_BASE_URL` a `'http://localhost:8000'`,
los 4 tests nuevos seguían en verde — no mordían. Fix: los tests de `@s2`, `@s3` y `@s4`
llaman explícitamente a `vi.stubEnv('VITE_RAG_API_BASE_URL', undefined)` para forzar la
variable a no-definida dentro del proceso de test, independientemente de `.env.local`. Con
ese cambio, la mutación a `8000` rompe los 3 tests como corresponde, y una mutación
adicional (`getRagBaseUrl` ignorando la env var y devolviendo siempre el default) rompe
específicamente `@s1`. Los 3 mutantes se probaron a mano y se revirtieron antes de dejar el
código en su estado final.

Nota fuera de alcance: `tests/PromptsService.test.ts:188-199` (el test de fallback de
`getDocAgentBaseUrl`, preexistente y no tocado por esta feature) tiene la misma exposición —
`.env.local` también define `VITE_DOC_AGENT_API_BASE_URL=http://localhost:8000`, que coincide
con su fallback. No se corrige acá: está fuera del alcance declarado en
`specs/fix-rag-fallback-port/spec.md` ("Tampoco cambia su test").

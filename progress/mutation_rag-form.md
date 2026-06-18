# Mutation Testing Report — rag-form

**Fecha:** 2026-06-10
**Agente:** qa
**Herramienta:** `tools/mutate.mjs` (Zero-dependency mutation tester)
**Comando de test:** `npm test -- --run` (Vitest)

---

## Archivos evaluados

| Archivo | Total mutantes | Killed | Survived | Score |
|---------|---------------|--------|----------|-------|
| `src/hooks/useRagUpload.ts` | 3 | 3 | 0 | 100% |
| `src/services/ragService.ts` | 0 | 0 | 0 | 100% |
| **TOTAL** | **3** | **3** | **0** | **100%** |

---

## Archivos excluidos (sin lógica condicional)

- `src/pages/RagPage.styles.ts` — solo styled-components, sin ramas lógicas
- `src/components/Loading/Loading.styles.ts` — solo estilos/keyframes
- `src/components/Loading/Loading.tsx` — sin lógica condicional mutable

---

## Detalle por archivo

### `src/hooks/useRagUpload.ts`

**Mutantes generados:** 3

| # | Mutación | Línea | Resultado |
|---|----------|-------|-----------|
| 1 | `=== → !==` (status === 'loading') | 21 | killed |
| 2 | `=== → !==` (files.length === 0) | 30 | killed |
| 3 | `\|\| → &&` (guard: `!files \|\| files.length === 0`) | 30 | killed |

**Score final: 100%**

#### Incidente — Mutante 3 sobreviviente (resuelto)

En la primera ejecución, el mutante `|| → &&` en la línea 30 sobrevivió:

```ts
// Original
if (!files || files.length === 0) return

// Mutante
if (!files && files.length === 0) return
```

**Causa del agujero:** los tests de @s3 solo verificaban que el botón estuviera
deshabilitado en el DOM — nunca llamaban a `submit()` directamente con
`files === null`. La rama `|| → &&` cambia el comportamiento real: con `&&`, si
`files` es `null`, la segunda condición (`files.length`) nunca se evalúa, por lo
que el `return` se ejecuta igualmente... pero si `files` es un array vacío `[]`,
la mutación produce un comportamiento diferente (ya no hace early-return).

**Acción tomada:** Se agregaron 2 tests directos sobre el hook en
`tests/RagForm.test.tsx` usando `renderHook`:

```ts
describe('useRagUpload — guard: submit no actúa sin archivos', () => {
  it('no llama a ragService.upload cuando files es null (estado inicial)', ...)
  it('no llama a ragService.upload cuando se llama submit con array vacío', ...)
})
```

Estos tests verifican que `ragService.upload` no se invoca cuando se llama
`submit()` con `files === null` y con `files = []` respectivamente.

Tras agregar los tests, el mutante fue killed. El total de tests pasó de 59 a 61.

**Mutantes equivalentes:** ninguno. El mutante `|| → &&` no es equivalente —
cambia comportamiento observable cuando `files` es un array vacío `[]`.

---

### `src/services/ragService.ts`

**Mutantes generados:** 0

El archivo es un stub que solo lanza un `Error` descriptivo. No contiene
operadores lógicos, comparadores ni literales booleanos que el catálogo de
mutaciones pueda transformar. Score 100% por vacuidad (ningún token mutable).

**Nota:** Este resultado es esperado y correcto. El servicio real (cuando se
implemente el endpoint) deberá tener su propia ronda de mutation testing.

---

## Equivalentes documentados

Ninguno. Todos los mutantes generados fueron killed por tests significativos.

---

## Tests afectados

| Archivo | Tests antes | Tests después |
|---------|-------------|---------------|
| `tests/RagForm.test.tsx` | 11 tests | 13 tests |
| Total suite | 59 tests | 61 tests |

---

## Veredicto final

**APROBADO**

Ambos archivos de lógica de la feature `rag-form` alcanzan el 100% de mutantes
killed. El único sobreviviente detectado en la primera pasada fue resuelto
agregando tests de cobertura directa sobre el hook. No se documentan mutantes
equivalentes.

# TDD Progress — rag-form

## Estado final: DONE — 59 tests verdes (46 previos + 13 nuevos)

---

## Mapa @s → test

| Scenario | Descripción | Test file | Estado |
|----------|-------------|-----------|--------|
| @s1 | Texto explicativo sobre chunking e indexado | `tests/RagForm.test.tsx` | VERDE |
| @s2 | File picker acepta solo `.txt` | `tests/RagForm.test.tsx` | VERDE |
| @s3 | Botón deshabilitado sin archivos | `tests/RagForm.test.tsx` | VERDE |
| @s4 | Al seleccionar archivos el botón se habilita | `tests/RagForm.test.tsx` | VERDE |
| @s5 | Al enviar aparece el indicador Loading | `tests/RagForm.test.tsx` | VERDE |
| @s6 | Botón e input se deshabilitan mientras carga (2 its) | `tests/RagForm.test.tsx` | VERDE |
| @s7 | Éxito: desaparece Loading y aparece confirmación | `tests/RagForm.test.tsx` | VERDE |
| @s8 | Error: desaparece Loading, aparece error y Reintentar | `tests/RagForm.test.tsx` | VERDE |
| @s9 | Reintentar reenvía archivos y vuelve al loading | `tests/RagForm.test.tsx` | VERDE |
| @s10 | Loading muestra puntos animados accesibles (3 its) | `tests/Loading.test.tsx` | VERDE |

---

## Archivos creados / modificados

### Creados
- `src/components/Loading/Loading.tsx` — componente con `role="status"` y `aria-label="Cargando"`, tres `LoadingDot` con `data-testid="loading-dot"`
- `src/components/Loading/Loading.styles.ts` — exporta `pulse` keyframe y `LoadingDot`, `LoadingWrapper`
- `src/components/Loading/index.ts` — barrel export
- `src/services/ragService.ts` — stub `upload(files): Promise<void>` que lanza error descriptivo
- `src/hooks/useRagUpload.ts` — estado `files`, `isLoading`, `status`, `error`; expone `setFiles`, `submit`, `retry`
- `src/pages/RagPage.styles.ts` — styled-components para la página
- `tests/Loading.test.tsx` — 3 tests para @s10
- `tests/RagForm.test.tsx` — 10 tests para @s1–@s9

### Modificados
- `src/pages/RagPage.tsx` — reemplaza placeholder; usa `useRagUpload` y `<Loading />`
- `src/features/HrChat/HrChat.styles.ts` — elimina definición local de `pulse`, importa desde `Loading.styles`

---

## Decisiones técnicas

1. **Loading identificado por `role="status"`** — correcto para ARIA; permite `getByRole('status')` sin atributos extra.

2. **`data-testid="loading-dot"` para los puntos** — los spans animados no tienen rol semántico nativo; `data-testid` es la única forma no-frágil de verificar su presencia sin `querySelector`.

3. **`ragService.upload` acepta `File[] | FileList`** — el mock en tests construye `File[]` via `Object.defineProperty`; el servicio real puede recibir `FileList` del DOM. Ambos son iterables.

4. **`useRagUpload` expone `status: UploadStatus`** — más expresivo que flags booleanos individuales; `isLoading` es un getter derivado (`status === 'loading'`).

5. **`retry()` en el hook llama a `submit()` directamente** — los archivos se preservan en el estado; no se necesita re-selección.

6. **Refactor de `pulse` keyframe** — extraído a `Loading.styles.ts` y re-exportado; `HrChat.styles.ts` lo importa para evitar duplicación. Los 19 tests de HrChat siguen pasando.

7. **Test @s1 usa dos matchers separados** (`/fragmentos|chunks/i` y `/index/i`) sobre el mismo párrafo — evita falsas afirmaciones de que "cualquier texto con esas palabras" sea el explicativo correcto.

8. **Test @s7 usa `/correctamente/i`** — la palabra "correctamente" aparece únicamente en el mensaje de éxito, no en el texto explicativo (que usa "indexados" y "chunks").

---

## Ciclos TDD ejecutados

1. **RED** `Loading.test.tsx` → módulo inexistente → falla con `Failed to resolve import`
2. **GREEN** Creados `Loading.tsx`, `Loading.styles.ts`, `index.ts`
3. **REFACTOR** `HrChat.styles.ts` importa `pulse` desde `Loading.styles`; 49 tests verdes
4. **RED** `RagForm.test.tsx` → `ragService` inexistente → falla con `Failed to resolve import`
5. **GREEN** Creados `ragService.ts`, `useRagUpload.ts`, `RagPage.styles.ts`; actualizado `RagPage.tsx`
6. **AJUSTE** Test @s7 `getByText(/index/i)` fallaba por múltiples matches → simplificado a `getByText(/correctamente/i)`
7. **FINAL** 59/59 tests verdes

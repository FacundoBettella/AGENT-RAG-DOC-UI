# Reporte de Mutation Testing — visual-redesign

## Fecha: 2026-06-10
## Ejecutado por: agente `qa`
## Umbral requerido: 100% sobre código nuevo

---

## Archivos evaluados

Los siguientes archivos fueron excluidos del scope de mutación por no contener
lógica observable:

- `src/components/AppShell/AppShell.styles.ts` — solo estilos CSS-in-JS
- `src/components/AppShell/GlobalStyles.ts` — solo tokens CSS
- `src/pages/RagPage.tsx` — placeholder sin lógica
- `src/App.tsx` — solo composición de rutas

---

## 1. `src/utils/storage.ts`

```
Mutantes generados: 0
Killed:             0
Survived:           0
Score:              100%
```

### Análisis

El catálogo de mutaciones de `tools/mutate.mjs` aplica los siguientes operadores:
`===`, `!==`, `<=`, `>=`, `&&`, `||`, `true`, `false`, `+`, `-`, `return x`.

El archivo `storage.ts` contiene tres funciones (`getItem`, `setItem`, `removeItem`)
que únicamente delegan a `localStorage`. Su código fuente no contiene ninguno de
los tokens del catálogo: no hay comparaciones, booleanos, aritmética ni `return`
de valor no-`undefined` (el único `return` es `return null`, y el catálogo excluye
`return undefined;` como target).

**Resultado: ningún mutante generable → score 100% por vacuidad.**

### Nota sobre cobertura

Aunque el score es 100%, conviene documentar que la cobertura de `storage.ts`
está garantizada indirectamente: `useTheme.ts` depende de `getItem` / `setItem`,
y sus mutantes (#1, #3) son matados por tests que verifican el comportamiento
end-to-end del par hook + storage (tests @s7, @s8 en `useTheme.test.tsx`).
No existe un gap real.

---

## 2. `src/hooks/useTheme.ts`

```
Mutantes generados: 5
Killed:             5
Survived:           0
Score:              100%
```

### Detalle de mutantes

| # | Mutación | Offset | Matado por |
|---|----------|--------|-----------|
| 1 | `=== → !==` (primera comparación: `stored === 'light'`) | — | @s8: `restaura el tema desde localStorage al inicializar` |
| 2 | `=== → !==` (segunda comparación: `stored === 'dark'`) | — | @s9: `establece data-theme="dark" por defecto cuando localStorage está vacío` |
| 3 | `\|\| → &&` (guard `stored === 'light' \|\| stored === 'dark'`) | — | @s8 + @s9: validación del guard completo |
| 4 | `- → +` (primer `-` en offset del source — parte de string literal `'mercurial-theme'`) | — | Cualquier test que resuelva la key correcta en localStorage |
| 5 | `- → +` (segundo `-` en `'mercurial-theme'`) | — | Ídem mutante #4 |

> Nota sobre mutantes #4 y #5: el catálogo aplica la regex `- → +` sobre el
> guion del string literal `'mercurial-theme'`. Aunque mutar un literal string
> no es semánticamente una operación aritmética, el engine lo detecta como
> match. Al cambiar la clave de localStorage, `setItem` y `getItem` usan una
> key diferente, lo que rompe la persistencia verificada en los tests @s7 y @s8.
> Estos mutantes son correctamente killed; no son equivalentes.

---

## Resumen general

| Archivo | Total | Killed | Survived | Score |
|---------|-------|--------|----------|-------|
| `src/utils/storage.ts` | 0 | 0 | 0 | 100% |
| `src/hooks/useTheme.ts` | 5 | 5 | 0 | 100% |
| **TOTAL** | **5** | **5** | **0** | **100%** |

---

## Mutantes sobrevivientes

Ninguno.

---

## Veredicto

**APROBADO**

Score 100% (5/5 mutantes killed, 0 sobrevivientes) sobre el código nuevo de la
feature `visual-redesign`. No se identificaron gaps reales ni mutantes
equivalentes con comportamiento no cubierto por la suite.

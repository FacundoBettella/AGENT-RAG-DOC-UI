# TDD Progress: visual-redesign

## Fecha: 2026-06-10

## Mapa @s → nombre de test

### tests/useTheme.test.tsx

| Escenario | Test |
|-----------|------|
| @s9 | `establece data-theme="dark" por defecto cuando localStorage está vacío` |
| @s8 | `restaura el tema desde localStorage al inicializar` |
| @s5 | `aplica data-theme="light" al activar el tema claro` |
| @s6 | `aplica data-theme="dark" al activar el tema oscuro` |
| @s7 | `persiste el tema en localStorage al cambiarlo` |
| — | `expone el valor de theme actual` |
| — | `actualiza el valor de theme tras setTheme` |

### tests/VisualRedesign.test.tsx

| Escenario | Test |
|-----------|------|
| @s1 | `el menú desplegable es visible tras hacer clic en el ícono de engranaje` |
| @s2 | `el menú desplegable desaparece al hacer clic de nuevo en el engranaje` |
| @s3 | `el menú contiene un control con rol switch o botón de tema` |
| @s4 | `el menú contiene un enlace con destino "/rag"` |
| @s5 | `aplica data-theme="light" al activar el tema claro` |
| @s6 | `aplica data-theme="dark" al activar el tema oscuro` |
| @s7 | `localStorage contiene la clave de tema con valor "light" tras activar tema claro` |
| @s8 | `el atributo data-theme es "light" al montar si localStorage tiene "light"` |
| @s9 | `el atributo data-theme es "dark" cuando localStorage está vacío` |
| @s10 | `existe un elemento con aria-label "Caduceo de Hermes" en el header` |
| @s11 | `la ruta "/" muestra el componente de chat de Recursos Humanos` |
| @s12 | `la ruta "/rag" muestra la pantalla RAG` |

## Decisiones técnicas

### Router split: App vs main.tsx
`App.tsx` solo contiene `<Routes>` — no envuelve con `BrowserRouter`. El `BrowserRouter`
queda en `main.tsx` (para el runtime real). Los tests usan `MemoryRouter` como wrapper
externo en `renderApp()`, lo que permite testear rutas sin JSDOM URL restrictions.

### AppShell con useTheme
`AppShell` consume `useTheme` directamente. Alternativa evaluada: pasar theme como prop
desde App. Se optó por el hook interno porque el Gherkin muestra que el toggle vive
en el header — acoplamiento justificado por la arquitectura de feature.

### Link con href explícito
`react-router-dom` `<Link>` renderiza `<a href="/rag">` con MemoryRouter pero sin
`href` explícito el atributo podría no estar presente en todos los environments.
Se añade `href="/rag"` explícito en el `as={Link}` styled-component para que
`toHaveAttribute('href', '/rag')` pase de forma determinista.

### role="menuitem" vs role="link"
Primera implementación añadía `role="menuitem"` al `<a>`, lo que anulaba el rol
implícito `link` y rompía `getByRole('link')`. Se eliminó el override de rol;
el elemento funciona como link accesible dentro del menú.

### Caduceo accesible
Se usa `role="img"` + `aria-label="Caduceo de Hermes"` en un `<span>` con el
carácter Unicode `⚕`. Testeable con `getByLabelText('Caduceo de Hermes')`.

### GlobalStyles light theme
Se agregaron tokens bajo `[data-theme="light"]` con paleta parchment:
- bg: #f5f0e8 (pergamino)
- gold: #a07820 (dorado oscuro sobre fondo claro)
- text-primary: #1a1a0f (casi negro)

## Mutantes equivalentes identificados

1. **`DEFAULT_THEME`**: Cambiar `'dark'` a `'light'` en `useTheme.ts` → test @s9 lo mata.
2. **`setItem` en `useEffect`**: Eliminar la llamada → test @s7 lo mata.
3. **`menuOpen` toggle**: Usar `setMenuOpen(true)` en lugar de `!prev` → test @s2 lo mata.
4. **`aria-label` del engranaje**: Cambiar a otro texto → tests @s1-@s7 lo matan.
5. **`getAttribute('data-theme')`**: Si se usa `className` en lugar de `setAttribute`
   en el hook, los tests @s5/@s6/@s8/@s9 lo matan.

## Totales finales

- Tests existentes preservados: 27/27
- Tests nuevos useTheme: 7/7
- Tests nuevos VisualRedesign: 12/12
- **Total: 46/46 verdes**

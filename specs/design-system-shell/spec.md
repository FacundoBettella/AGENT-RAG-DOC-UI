# design-system-shell — spec

> Estado: **cerrada**. Sin preguntas abiertas. Lista para destilar Gherkin.

## Propósito

Reemplazar el header actual por un sidebar de navegación global construido en Tailwind v4 con la paleta Material Design 3, dejando el shell listo para las features 11, 12 y 13.

## Contrato

### Alcance

**Dentro:** el shell — sidebar fijo, header superior, tokens MD3 (light + dark), theme toggle, rutas y placeholders de las features 12 y 13, eliminación del `Footer` global.

**Fuera:** el contenido de `HrChat`, `RagPage` y `FaqPage` (siguen en styled-components, sin tocar), botones de buscar y notificaciones, tarjeta de usuario del sidebar, item "Historial", y todo comportamiento responsive/mobile del sidebar.

Consecuencia asumida: `src/components/Footer/` se elimina junto con sus tests, y los tests de `AppShell` se reescriben contra la nueva estructura.

### Entradas

- **Mockups de referencia** (fuente única del diseño, gitignoreados):
  - `progress/mockups/design-system-shell/mockup-analizador-contratos.html`
  - `progress/mockups/design-system-shell/mockup-chatbot-ia.html`
- **`AppShell`**: sin props nuevas; sigue recibiendo `children`.
- **Ruta activa**: `useLocation` de React Router determina el item marcado.
- **Tema**: `useTheme` (existente) — lee/persiste `mercurial-theme` en `localStorage` y escribe `data-theme` en `<html>`.

### Salidas

Árbol con `<nav>` fijo a la izquierda (`w-72`, 288px, alto completo) + `<header>` sticky + `<main>`.

**Sidebar, de arriba abajo:**

1. **Marca**: caduceo `⚕` + `Mercurial`, dentro de un `<Link to="/">` con `aria-label="Ir al chat"` (hereda la Decisión "el caduceo forma parte del enlace" de `header-polish`).
2. **Navegación** (`<nav>`, orden exacto):

| # | Label | Ícono (Material Symbols) | Ruta | Estado en esta feature |
|---|---|---|---|---|
| 1 | Chatbot IA | `smart_toy` | `/` | Pantalla existente (`HrChat`) |
| 2 | Analizador de Contratos | `description` | `/contracts` | Placeholder "Próximamente" (feature 12) |
| 3 | Base de conocimiento | `library_books` | `/rag` | Pantalla existente (`RagPage`) |
| 4 | Configuración | `settings` | `/settings` | Placeholder "Próximamente" (feature 13) |

3. **Pie del sidebar**: fila de tema — ícono `light_mode`/`dark_mode` + label + botón `role="switch"` con `aria-checked` (reutiliza el patrón accesible ya testeado en `visual-redesign`).

**Estados de un item de navegación:**

| Estado | Tratamiento |
|---|---|
| Activo | `bg-primary` + `text-on-primary` + `aria-current="page"` |
| Inactivo | `text-on-surface-variant` |
| Hover | `bg-surface-container` (bajo `@media (hover: hover)`) |
| Foco | anillo `:focus-visible` visible sobre `outline` |

**Header superior:** barra sticky alineada al borde derecho del sidebar, con un único control: botón **"Ayuda"** que navega a `/faq`. Sin título de página, sin buscador, sin notificaciones, sin separador vertical.

**Rutas** (en `constants/routes.ts`, según convenciones del perfil):
`/` (chat), `/contracts`, `/rag`, `/settings`, `/faq`. Las features 12 y 13 heredan `/contracts` y `/settings`.

### Tokens

Definidos como custom properties en `@theme` (light, valor por defecto) y sobreescritos en el selector `[data-theme='dark']`. Las utilities de Tailwind los consumen vía `var(--color-*)`, así que el cambio de tema no re-renderiza React.

| Token | Light | Dark |
|---|---|---|
| `primary` | `#173809` | `#a3d18c` |
| `on-primary` | `#ffffff` | `#12360a` |
| `primary-container` | `#2d4f1e` | `#2d4f1e` |
| `on-primary-container` | `#98c083` | `#bfeaa7` |
| `secondary` | `#77574d` | `#e7bdb0` |
| `secondary-container` | `#fed3c7` | `#5d3f37` |
| `tertiary` | `#511e3a` | `#e5b9d0` |
| `tertiary-container` | `#6c3451` | `#6c3451` |
| `error` | `#ba1a1a` | `#ffb4ab` |
| `error-container` | `#ffdad6` | `#93000a` |
| `background` / `surface` | `#f9faf2` | `#12140f` |
| `surface-container-low` | `#f4f4ec` | `#1a1c17` |
| `surface-container` | `#eeeee7` | `#1e201b` |
| `surface-container-high` | `#e8e9e1` | `#282b25` |
| `surface-container-highest` | `#e2e3dc` | `#333630` |
| `on-surface` | `#1a1c18` | `#e2e3dc` |
| `on-surface-variant` | `#43493e` | `#c3c8bb` |
| `outline` | `#73796d` | `#8d9387` |
| `outline-variant` | `#c3c8bb` | `#43493e` |

- Tipografía: `Source Serif 4` (display/headline), `Inter` (body/label).
- Radios: default `0.25rem`, `lg 0.5rem`, `xl 0.75rem`, `full 9999px`.
- Iconos: Material Symbols Outlined.
- Los pares `on-*` de `secondary`, `tertiary` y `error` se definirán cuando una feature los use; el shell no los necesita.

### Estados

No hay proceso ni exit codes: el shell es presentacional. Su único estado propio es el tema (`'light' | 'dark'`), que ya vive en `useTheme`.

## Decisiones

1. **Tailwind, no styled-components.** Un solo sistema de estilo por proyecto; los mockups ya vienen en utilities. *Descartada:* seguir en styled-components — obligaría a retraducir a mano cada mockup.

2. **Sidebar global, no parcial.** Aplica a todas las rutas, existentes y nuevas. *Descartada:* sidebar solo en pantallas nuevas — dos layouts conviviendo.

3. **Tailwind v4 (CSS-first, `@theme`), no v3 con `tailwind.config.js`.** Los tokens quedan como custom properties, que es lo que el `data-theme` de `useTheme` ya necesita. *Descartada:* v3 — config en JS y tokens no expuestos a CSS.

4. **Fuentes e iconos self-hosted** (`@fontsource/inter`, `@fontsource/source-serif-4`, `material-symbols`). La app corre contra un backend local; sin internet, el CDN deja toda la UI sin iconos. *Descartada:* CDN de Google — más simple, frágil offline.

5. **Branding: se mantiene "Mercurial" + caduceo.** "Sylvan Logic" es placeholder del generador del mockup, y el nombre está en `package.json`, `feature_list.json` y tres respuestas de la FAQ. *Descartada:* adoptar el naming del mockup.

6. **Rutas de las features 12 y 13: página placeholder "Próximamente".** El sidebar es global desde ya, pero esas pantallas llegan después; un item que lleva a 404 rompe la navegación mientras tanto. *Descartada:* item deshabilitado — comunica menos.

7. **El item "Historial" no se renderiza.** Fuera de alcance y sin pantalla detrás. *Descartada:* renderizarlo deshabilitado — ocupa peso visual y depende del color para decir "no disponible".

8. **La tarjeta de usuario del pie del sidebar se excluye.** No hay auth ni dato real de usuario; nombre y mail inventados son contenido falso. *Descartada:* placeholder estático — engaña sobre las capacidades del sistema.

9. **Migración solo del shell; Tailwind y styled-components conviven de forma temporal y reconocida.** Migrar las páginas acá se comería el rediseño de la feature 11. *Descartada:* big-bang — infla esta feature y duplica trabajo con 11/12/13.

10. **`GlobalStyles` (tokens Zelda) sigue inyectándose mientras dure la convivencia**, pero deja de pintar `body`: el fondo global pasa a `bg-background` del shell. Las páginas legacy conservan sus superficies Zelda dentro de `<main>`. *Descartada:* borrar los tokens Zelda ya — dejaría las tres páginas sin estilo.

11. **El `Footer` global se elimina y "Ayuda" del header navega a `/faq`.** El punto único de navegación global pasa a ser el shell nuevo; mantener footer y sidebar sería doble sistema de navegación. *Descartada:* conservar el footer — redundante.

12. **Buscar y notificaciones quedan fuera; "Ayuda" entra porque tiene destino real.** Un botón sin handler es UI muerta que promete función inexistente. *Descartada:* incluirlos deshabilitados — el usuario no distingue "no disponible" de "roto".

13. **El header superior no renderiza título de página.** Las tres páginas existentes ya traen su propio `<h1>` y no se tocan en esta feature; un título en el header duplicaría el encabezado principal. *Descartada:* título derivado de la ruta — duplica `<h1>`.

14. **`/` sigue siendo el chat, y "Chatbot IA" es el primer item del sidebar.** Es la única pantalla plenamente funcional; encabezar la navegación con un placeholder degradaría la app. *Descartada:* el orden del mockup (Contratos primero) — su pantalla aún no existe.

15. **`/rag` entra como item propio ("Base de conocimiento"), no anidado bajo Configuración.** Un submenú exige patrón ARIA de disclosure y pre-define el layout de la feature 13 por un solo link. *Descartada:* anidarlo — más complejidad, menos descubrible.

16. **`/faq` no tiene item de sidebar.** Es contenido de ayuda, no un destino de trabajo; ya es alcanzable desde el botón "Ayuda". *Descartada:* quinto item — diluye una navegación de cuatro destinos operativos.

17. **El theme toggle vive en el pie del sidebar.** Es el espacio que liberó la tarjeta de usuario excluida y es la convención para preferencias persistentes. *Descartada:* dejarlo en un menú de engranaje — esconde tras dos clics algo que ya era de un clic.

18. **Dark mode derivado con la heurística MD3, no invirtiendo el light.** Superficies near-black con tinte cálido-verdoso, elevación progresivamente más clara, y `on-surface-variant`/`outline-variant` intercambiados entre temas. *Descartada:* invertir luminancias — mata la profundidad y hace vibrar los acentos.

19. **El tema por defecto sigue siendo `dark`.** Es comportamiento persistido de `visual-redesign` (feature `done`); cambiarlo es decisión de producto, no de esta migración. *Descartada:* pasar el default a `light` para igualar el mockup — revierte una feature cerrada sin pedido explícito.

20. **Mobile fuera de alcance.** El sidebar queda fijo; el comportamiento en viewports chicos se resuelve en una feature futura. *Descartada:* drawer con hamburguesa acá — agrega estado, foco y overlay a una feature que ya migra el sistema de estilos entero.

# brand-restyle — spec

> Estado: **cerrada** (reabierta y ampliada: renombre de la app a "Workspace AI" y eliminación del caduceo). Sin preguntas abiertas. Lista para destilar Gherkin.
> Precedente: `specs/design-system-shell/spec.md` (feature 10). Esta feature reemplaza sus tokens y cierra su convivencia con styled-components.
> Regla de redacción (Decisión 1): ni este spec, ni el `.feature`, ni `testing.md`, ni los commits, ni el código nombran la marca de referencia.

## Propósito

Reemplazar paleta, tipografía, lenguaje visual y nombre visible de toda la app ("Workspace AI", sin caduceo) por una identidad corporativa sobria (amarillo de acento sobre grises carbón, una sola sans, esquinas rectas) sin ninguna referencia nominal a la marca de origen.

## Contrato

### Alcance

**Dentro:** tokens de color, tipografía y radios en `src/index.css`; migración de `bg-primary`/`text-on-primary` a `accent`; `font-serif` → `font-display`; migración de `FaqPage` y `Loading` a Tailwind; eliminación de `GlobalStyles` y de la dependencia `styled-components`; dos tests guardia (anti-marca y contraste); renombre visible de la app de "Mercurial" a "Workspace AI" y eliminación del caduceo (ver "Nombre de la app"); favicon propio (ver "Favicon").

**Fuera:** copy fuera de las menciones del nombre de la app, estructura y comportamiento de pantallas, iconografía (Material Symbols), sombras, identificadores internos no visibles que contienen "mercurial" (ver Decisión 15).

### Entradas

- Valores públicos de referencia (no hay guía oficial): amarillo `#FFE600`, carbón `#2E2E38`, carbón profundo `#1A1A24`, gris medio `#747480`, gris claro `#C4C4CD`. El resto de la escala de grises se deriva de ellos.
- Mockup: ninguno.

### Tokens de color

Light es el valor por defecto en `@theme`; dark sobreescribe en `[data-theme='dark']` (mismo mecanismo que design-system-shell). `index.css` define **exactamente** estos tokens — ni más ni menos.

| Token | Light | Dark |
|---|---|---|
| `primary` | `#2E2E38` | `#FFE600` |
| `primary-container` | `#2E2E38` | `#3A3A47` |
| `on-primary-container` | `#FFE600` | `#FFE600` |
| `accent` | `#FFE600` | `#FFE600` |
| `on-accent` | `#2E2E38` | `#2E2E38` |
| `secondary-container` | `#E1E1E6` | `#3A3A47` |
| `on-secondary-container` | `#2E2E38` | `#F6F6FA` |
| `error` | `#B3261E` | `#FF8A80` |
| `error-container` | `#FDE7E9` | `#5C1F1F` |
| `on-error-container` | `#8C1D18` | `#FFDAD6` |
| `background` / `surface` | `#FFFFFF` | `#1A1A24` |
| `surface-container-low` | `#F6F6FA` | `#23232F` |
| `surface-container` | `#EAEAF2` | `#2E2E38` |
| `surface-container-high` | `#E1E1E6` | `#3A3A47` |
| `surface-container-highest` | `#D7D7DE` | `#474754` |
| `on-surface` | `#2E2E38` | `#F6F6FA` |
| `on-surface-variant` | `#5C5C68` | `#C4C4CD` |
| `outline` | `#6E6E7A` | `#9A9AA6` |
| `outline-variant` | `#C4C4CD` | `#3A3A47` |

Se eliminan `on-primary`, `secondary`, `tertiary` y `tertiary-container` (sin consumidores tras la migración).

**Reglas de uso en componentes:**

- Todo `bg-primary` pasa a `bg-accent`, todo `text-on-primary` a `text-on-accent`, `bg-primary/90` a `bg-accent/90`. Afecta: item activo y switch encendido del sidebar, botones de acción principales, burbuja y avatar del asistente/usuario en el chat.
- `text-primary`, `border-primary` y `ring-primary` se mantienen: `primary` es legible como texto en ambos temas.
- Tras la migración no queda ningún `bg-primary` ni `text-on-primary` en `src/`, con una única excepción: los puntos de `Loading` (ver Decisión 14).

### Pares de contraste (test guardia)

Un test lee `src/index.css`, resuelve los tokens de cada tema y exige ratio WCAG **≥ 4.5:1** en cada par, en light y en dark:

| Texto | Fondos |
|---|---|
| `on-surface`, `on-surface-variant`, `primary` | `background`, `surface`, `surface-container-low`, `surface-container`, `surface-container-high`, `surface-container-highest` |
| `error` | `background`, `surface`, `surface-container-low`, `surface-container` |
| `outline` | `background`, `surface-container-low` |
| `on-accent` | `accent` |
| `on-primary-container` | `primary-container` |
| `on-secondary-container` | `secondary-container` |
| `on-error-container` | `error-container` |

La tabla de tokens de arriba cumple todos los pares (mínimo: `on-surface-variant` sobre `surface-container-highest` light, 4.60).

### Tipografía

- Familia única: **Overpass**, self-hosted vía `@fontsource/overpass`, pesos 400, 500, 600 y 700 importados en `main.tsx`.
- `@theme`: `--font-sans` y `--font-display` apuntan a `'Overpass', ui-sans-serif, system-ui, sans-serif`. Se elimina `--font-serif`.
- Los 16 usos de `font-serif` en `src/` pasan a `font-display`; no queda ningún `font-serif`.
- Se desinstalan `@fontsource/inter` y `@fontsource/source-serif-4` y se borran sus imports.
- `body` toma `--font-sans` (hoy `GlobalStyles` lo pisa con la pila del sistema).

### Radios

- En `@theme`, todos los tokens `--radius-*` de Tailwind (`xs` a `4xl`) valen `0`. `rounded-full` no cambia.
- Resultado observable: todo elemento con `rounded*` distinto de `rounded-full` renderiza con `border-radius: 0`. Si alguna variante (p. ej. `rounded` sin sufijo) no consume un token, se reemplaza en `src/`.

### Estilos base (ex `GlobalStyles`)

Se eliminan `src/components/AppShell/GlobalStyles.ts`, su uso en `AppShell` y la dependencia `styled-components` (+ `@types/styled-components`). Sus reglas base pasan a `@layer base` en `index.css`, con los tokens nuevos:

- `body`: `font-family: var(--font-sans)`, `color: var(--color-on-surface)`, `background: var(--color-background)`, `font-size: 15px`, `line-height: 1.6`, antialiasing y transición de color/fondo (0.25s).
- `h1`–`h4`: peso 700, `letter-spacing: -0.025em`, `line-height: 1.2`, margen 0.
- `button`: fuente heredada, peso 600, `cursor: pointer`. `input`/`textarea`: fuente y tamaño heredados.
- Desaparecen todas las variables legacy (`--color-gold`, `--color-text-*`, `--color-bg`, `--shadow-*`, etc.). No queda ningún `var(--color-gold…)` ni `var(--color-text-…)` en `src/`.

### FaqPage y Loading en Tailwind

Se borran `FaqPage.styles.ts` y `Loading.styles.ts`. Estructura, roles, textos, `aria-*` y `data-testid` se conservan (los tests existentes siguen verdes sin tocar sus queries), salvo las menciones del nombre de la app (ver "Nombre de la app").

| Elemento legacy | Tokens nuevos |
|---|---|
| Título de FAQ (`--color-gold`) | `text-primary` + `font-display` |
| Link "volver" (`--color-text-muted`, hover gold) | `text-on-surface-variant`, hover `text-primary` |
| Pregunta (`--color-text-primary`) | `text-on-surface` |
| Respuesta (`--color-text-muted`) | `text-on-surface-variant` |
| Puntos de `Loading` (`--color-gold-bright`) | `bg-primary`, `rounded-full`, mismo patrón de animación que el indicador de escritura de `ChatColumn` (`animate-bounce` con delays 0 / 0.2s / 0.4s) |

### Guardia anti-marca (test)

Un test recorre `src/`, `tests/`, `index.html` y `package.json` y falla si algún archivo contiene:

- el término T1 como palabra completa, sin distinguir mayúsculas (regex `\bT1\b`, flag `i`);
- el término T2 como substring, sin distinguir mayúsculas.

Los términos van **codificados en base64** en el test y se decodifican en tiempo de ejecución: T1 = `RVk=`, T2 = `SW50ZXJzdGF0ZQ==`. El propio guardia no puede contener los términos en texto plano.

El comentario de cabecera de `index.css` se reescribe en términos neutros (sin el nombre del generador del mockup anterior ni de la marca de referencia).

### Nombre de la app

El nombre visible pasa de "Mercurial" a **"Workspace AI"** y el caduceo se elimina sin reemplazo (ni ícono ni glifo).

| Ubicación | Hoy | Pasa a |
|---|---|---|
| `Sidebar.tsx` (enlace de marca) | `<span role="img" aria-label="Caduceo de Hermes">⚕</span>` + `Mercurial` | solo el texto `Workspace AI` (el `<span>` del caduceo se borra; el enlace conserva su destino y `aria-label="Ir al chat"`) |
| `HrChat.constants.ts` `ASSISTANT_NAME` | `Asistente Mercurial` | `Asistente` (sin nombre de la app) |
| `HrChat.constants.ts` `GREETING_TEXT` | `¡Hola! Soy el asistente de Mercurial. …` | `¡Hola! Soy el asistente de Workspace AI. …` (resto igual) |
| `HrChat.constants.ts` `THINKING_TEXT` | `Mercurial está procesando tu consulta` | `Workspace AI está procesando tu consulta` |
| `FaqPage.tsx`, respuesta "¿Cómo funciona el sistema de búsqueda?" | `Mercurial usa un sistema RAG …` | `Workspace AI usa un sistema RAG …` |
| `FaqPage.tsx`, respuesta "¿Qué pasa si el sistema no sabe la respuesta?" | `Mercurial indicará que …` | `Workspace AI indicará que …` |
| `index.html` `<title>` | `Mercurial` | `Workspace AI` |

**Criterio verificable:**

- Ningún texto renderizado de la app (en ninguna ruta) ni `index.html` contiene "Mercurial" (sin distinguir mayúsculas).
- El sidebar muestra "Workspace AI" dentro del enlace de marca.
- El sidebar no renderiza el caduceo: no contiene el glifo `⚕` ni ningún elemento con `aria-label="Caduceo de Hermes"`.
- El encabezado de los mensajes del asistente muestra `Asistente · <hora>`.

**Tests de features anteriores afectados:** los tests que afirman el nombre o el caduceo viejos se actualizan al contrato nuevo — `HeaderPolish.test.tsx` (@s1 nombre en el enlace; @s8 caduceo dentro del enlace pasa a afirmar su ausencia), `VisualRedesign.test.tsx` (@s10 caduceo visible pasa a afirmar su ausencia), `FaqSection.test.tsx` (@s6 sidebar con el nombre), `HrChat.test.tsx` (saludo, `THINKING_TEXT`, `ASSISTANT_NAME`), `BrandRestyle.test.tsx` (`authorName` del fixture). No se tocan los usos internos de la Decisión 15.

### Favicon

- Se crea `public/favicon.svg` (la carpeta `public/` no existe hoy y se crea): un robot simple, relleno en el amarillo `accent` (`#FFE600`) con contorno y detalles en el carbón `on-accent` (`#2E2E38`), legible sobre pestañas claras y oscuras.
- `index.html` reemplaza `<link rel="icon" type="image/svg+xml" href="/vite.svg" />` por `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.
- Sin ninguna forma del logotipo de referencia (Decisión 3).

**Criterio verificable:** `index.html` no referencia `vite.svg` y sí referencia `/favicon.svg`; `public/favicon.svg` existe, es un SVG válido y contiene el color `#FFE600`.

### Estados

Sin proceso ni exit codes: cambio presentacional. El único estado sigue siendo el tema (`'light' | 'dark'`, default `dark`) de `useTheme`.

## Decisiones

1. **Ninguna mención nominal a la marca de referencia, tampoco en el repo** (spec, `.feature`, `testing.md`, commits, `feature_list.json`). El repo se versiona y se comparte; un spec es tan visible como un comentario. *Descartada:* restringirlo solo a la UI.

2. **Guardia anti-marca automatizada, con los términos en base64.** Convierte la restricción dura en contrato que no se rompe en silencio; codificarlos evita que el guardia sea la mención. *Descartada:* revisión manual — no escala ni se sostiene en el tiempo.

3. **Sin el paralelogramo inclinado ni ninguna forma del logotipo de referencia.** Es un elemento registrado que delata el origen sin nombrarlo. *Descartada:* usarlo como acento decorativo.

4. **La app se llama "Workspace AI" y el caduceo se elimina sin reemplazo; el asistente se llama solo "Asistente".** Pedido explícito del humano: nombre genérico. Reemplaza la Decisión 5 de design-system-shell. *Descartada:* mantener "Mercurial" + caduceo, o otro glifo.

5. Hereda Decisión 19 (tema por defecto `dark`) de `specs/design-system-shell/spec.md`; ambos temas se mantienen.

6. Hereda Decisión 4 (fuentes e iconos self-hosted, Material Symbols) de `specs/design-system-shell/spec.md`.

7. **`primary` cambia por tema para ser legible como texto (carbón en light, amarillo en dark); el amarillo de relleno vive en `accent`/`on-accent`.** Respeta el contrato MD3 de `primary`. *Descartada:* `primary` amarillo en ambos temas — 1.3:1 sobre blanco en ~15 usos de texto/borde.

8. **Paleta derivada de los hex públicos; secondary/tertiary pasan a grises o se eliminan.** No hay guía oficial y la identidad es amarillo + grises. *Descartada:* inventar acentos secundarios cromáticos — sin fuente que los respalde.

9. **Test de contraste ≥ 4.5:1 sobre los pares listados, en ambos temas.** El amarillo sobre fondo claro es la falla típica de esta paleta; el test la vuelve irrepetible. *Descartada:* verificación visual a ojo — no detecta regresiones.

10. **Overpass, libre (OFL) y self-hosted.** Comparte linaje de diseño con la fuente propietaria (ambas derivan de Highway Gothic). *Descartada:* la fuente propietaria — requiere licencia no cedible y su nombre de familia contiene la marca.

11. **Una sola familia: `font-serif` se reemplaza por un token `font-display`.** El lenguaje de referencia usa una sola sans; un token `--font-serif` apuntando a una sans miente. *Descartada:* repuntar `--font-serif` — cero cambios, nombre engañoso.

12. **Radios en 0 salvo `rounded-full`.** Lenguaje plano y de ángulos rectos, aplicado vía tokens. Consecuencia asumida: las burbujas del chat pierden la esquina asimétrica. *Descartada:* conservar radios suaves — contradice la estética pedida.

13. **Se migra FAQ y Loading a Tailwind y se elimina `GlobalStyles` + `styled-components`.** `GlobalStyles` pisa `--color-surface`, `--color-error` y la fuente de `body`; borrarlo cierra la Decisión 9 de design-system-shell. *Descartada:* aliasar variables legacy — mantiene dos sistemas.

14. **Los puntos de `Loading` usan `bg-primary`, no `bg-accent`.** Amarillo sobre fondo claro no se ve; `primary` es visible en ambos temas. *Descartada:* `accent` — invisible en light.

15. **Solo se renombra lo visible; quedan la clave `mercurial-theme`, el `name` de `package.json` y los hosts de fixture `*.mercurial.local`.** Cambiar la clave resetea el tema guardado de cada usuario; lo demás nunca se ve. *Descartada:* renombre total.

16. **Favicon propio: robot simple en `public/favicon.svg`, amarillo `accent` con contorno carbón.** Reemplaza el de Vite (hoy roto: `vite.svg` no existe); el contorno lo vuelve legible en pestañas claras. *Descartada:* robot solo amarillo — se pierde sobre fondo claro.

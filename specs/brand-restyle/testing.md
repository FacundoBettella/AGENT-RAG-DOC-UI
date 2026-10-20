# brand-restyle — testing

**Modo:** test-after

## Mapa @s → test

| Escenario | Test |
|---|---|
| @s1 paleta y acento | `tests/BrandRestyle.test.tsx` > `@s1`: tokens light exactos, tokens dark exactos, sin `on-primary`/`secondary`/`tertiary`/`tertiary-container`, sin `bg-primary`/`text-on-primary` en `src/` (excepción Loading, ver nota), item activo del sidebar y avatar del asistente renderizados con `bg-accent text-on-accent`, botones de acción principales (UploadColumn, ChatColumn, PromptCard, ConfirmSaveModal, RagPage) con `bg-accent ... text-on-accent` |
| @s2 contraste WCAG AA | `tests/ContrastGuard.test.ts` (helpers en `tests/brandTokens.ts`): ratio ≥ 4.5 para todos los pares del spec en light y en dark; sanidad de la fórmula (negro/blanco 21:1) y regresión detectada (primary amarillo en light falla) |
| @s3 tipografía | `tests/BrandRestyle.test.tsx` > `@s3`: `--font-sans`/`--font-display` = Overpass + fallback, `main.tsx` importa 400/500/600/700, sin `--font-serif` ni `font-serif`, `package.json` sin Inter/Source Serif y con Overpass, `body` usa `var(--font-sans)` |
| @s4 radios | `tests/BrandRestyle.test.tsx` > `@s4`: `--radius-xs..4xl` valen 0, no se redefine `--radius-full` y `rounded-full` sigue en uso, ninguna clase `rounded` sin sufijo en `src/` |
| @s5 FAQ y Loading | `tests/BrandRestyle.test.tsx` > `@s5`: clases del título/link/pregunta/respuesta de FAQ, puntos de Loading (`bg-primary rounded-full animate-bounce` + delays 0/0.2s/0.4s), archivos `*.styles.ts` y `GlobalStyles` inexistentes, `package.json` sin styled-components ni su tipado, sin `var(--color-gold)` ni `var(--color-text-)`. Los roles/aria/testid se conservan: siguen verdes `tests/Loading.test.tsx` y `tests/FaqSection.test.tsx` sin cambios |
| @s6 guardia anti-marca | `tests/BrandGuard.test.ts`: términos en base64 decodificados en runtime; recorre `src/`, `tests/`, `index.html`, `package.json`; palabra completa (T1) y substring (T2); el propio guardia se lee aparte (Vite excluye al importador del glob) y se verifica que no contiene los términos en claro; test de que los detectores muerden |
| @s7 nombre de la app | `tests/BrandRestyle.test.tsx` > `@s7`: en cada ruta (`/`, `/faq`, `/contracts`, `/settings`, `/rag`) el enlace de marca muestra "Workspace AI", conserva `href="/"` y `aria-label="Ir al chat"`, el sidebar no contiene `⚕` ni `aria-label="Caduceo de Hermes"` y el DOM renderizado no contiene "mercurial"; saludo del chat; texto de procesando (query pendiente); respuestas de FAQ (búsqueda y desconocida) empiezan con el nombre; `<title>` de `index.html` y sin "mercurial". Tests de features previas adaptados: `HeaderPolish`, `VisualRedesign` (@s10), `FaqSection` (@s6), `HrChat` |
| @s8 asistente = "Asistente" | `tests/BrandRestyle.test.tsx` > `@s8`: `ASSISTANT_NAME === 'Asistente'` sin el nombre de la app; `MessageBubble` del asistente muestra `Asistente · 09:05`. Refuerzo en `tests/HrChat.test.tsx` (encabezado `Asistente · 09:05` en un intercambio real) |
| @s9 favicon | `tests/BrandRestyle.test.tsx` > `@s9`: `index.html` referencia `/favicon.svg` con `type="image/svg+xml"` y no `vite.svg`; `public/favicon.svg` existe y parsea como SVG válido (`DOMParser`, sin `parsererror`); contiene `fill="#FFE600"` y `stroke="#2E2E38"` |

## Verificación de que los tests muerden (mutaciones manuales)

Cada mutación se aplicó, se corrió la suite de brand-restyle, falló el test indicado, y se revirtió:

- `--color-primary` light a `#ffe600` → falla @s1 (tokens light) y @s2 (contraste light).
- `--radius-lg: 0.5rem` → falla @s4 (radios en 0).
- `--font-sans` apuntando a otra familia → falla @s3.
- Delay del tercer punto de Loading `0.4s` → `0.5s` → falla @s5 (Loading).
- Quitar `font-display` del título de FAQ → falla @s5 (FAQ).
- Agregar una clase `rounded` sin sufijo en `src/` → falla @s4.
- Agregar un archivo en `src/` con T2 / con T1 → falla @s6 (substring / palabra completa).

- Cambiar `ASSISTANT_NAME` a `'Asistente Workspace AI'` → fallan los dos tests de @s8.
- Re-agregar un `<span aria-label="Caduceo de Hermes">⚕</span>` al sidebar → falla @s7 en las cinco rutas.
- `THINKING_TEXT` sin el nombre de la app → falla @s7 (texto de procesando).
- Respuesta de FAQ de respuesta desconocida sin el nombre → falla @s7 (FAQ).
- `index.html` con `<title>Mercurial</title>` y `href="/vite.svg"` → fallan @s7 (título) y @s9 (enlace de ícono).
- `public/favicon.svg` con `#FFE601` en lugar de `#FFE600` → falla @s9 (colores); con `</svg>` removido → falla @s9 (SVG válido).

Hallazgo durante la verificación: el primer borrador del guardia armaba la regex con `\b` dentro de un template literal (backspace, no word boundary) y pasaba en vacío; lo detectó el test "los detectores muerden". Corregido con `\\b`.

## Notas

- **Excepción en @s1 / Decisión 14:** el escenario dice que no queda ningún `bg-primary` en `src/`, pero @s5 exige `bg-primary` en los puntos de `Loading` (Decisión 14: `accent` es invisible en light). El test de @s1 admite exactamente `src/components/Loading/Loading.tsx` como único archivo con `bg-primary`.
- **Lectura de `src/index.css` con `node:fs`:** Vitest corre con CSS deshabilitado y `?raw`/`?inline` devuelven cadena vacía para `.css`. Por eso los tests de tokens leen el archivo con `readFileSync`. Para que `tsc -b` lo acepte se sumó `@types/node` a `devDependencies` y `"node"` a `types` en `tsconfig.json`.
- Dependencias: se agregó `@fontsource/overpass`; se quitaron `@fontsource/inter`, `@fontsource/source-serif-4`, `styled-components` y `@types/styled-components`. `package-lock.json` regenerado y la imagen `dev` reconstruida.
- Radios: `rounded` sin sufijo (un único uso, el botón de quitar archivo en `RagPage`) se eliminó de la clase, porque no consume un token `--radius-*`.
- **Infra para @s9:** `public/` y `index.html` no están en los bind mounts; se agregó `COPY public/ ./public/` al `Dockerfile` y la imagen `dev` se reconstruye con `docker compose up -d --build dev` para que los tests y el dev server vean el favicon y el título nuevos.

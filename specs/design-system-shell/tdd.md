# design-system-shell — tdd.md

**Modo:** test-after (indicado por el `tech-lead`; también anotado en `feature_list.json` como `"mode": "test-after"`).

Se implementó el shell completo primero (Tailwind v4 CSS-first, tokens MD3, `Sidebar`,
`Header`, `AppShell`, rutas y placeholders de las features 12/13) y luego se blindó cada
escenario aprobado con un test concreto en `tests/DesignSystemShell.test.tsx`. Cada test se
verificó a mano rompiendo la implementación correspondiente (ver "Verificación de mordida"
más abajo) antes de dejarlo asentado.

## Mapa `@s → test`

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` El sidebar ofrece los cuatro destinos en el orden acordado | `muestra, en orden, los enlaces Chatbot IA, Analizador de Contratos, Base de conocimiento y Configuración` | `tests/DesignSystemShell.test.tsx` |
| `@s2` Los destinos de las features futuras muestran "Próximamente" | `la ruta "/contracts" muestra el texto "Próximamente"` y `la ruta "/settings" muestra el texto "Próximamente"` | `tests/DesignSystemShell.test.tsx` |
| `@s3` El item de navegación activo se resalta y el resto no | `el enlace "Base de conocimiento" tiene aria-current="page" y los otros tres no tienen aria-current` | `tests/DesignSystemShell.test.tsx` |
| `@s4` El botón "Ayuda" del header navega a /faq | `hacer clic en "Ayuda" cambia la ruta activa a "/faq" sin recargar la página` | `tests/DesignSystemShell.test.tsx` |
| `@s5` El toggle de tema en el pie del sidebar cambia el tema y lo persiste | `activar el switch de tema aplica data-theme="light" y lo persiste en localStorage` | `tests/DesignSystemShell.test.tsx` |
| `@s6` La landing muestra el chat y no los elementos excluidos del alcance | `muestra el chat de RR.HH., sin footer, sin "Historial" y sin buscar/notificaciones/título en el header` | `tests/DesignSystemShell.test.tsx` |

## Verificación de mordida (cada test falla si se rompe la implementación)

Verificado a mano, uno por uno, revirtiendo temporalmente el cambio correspondiente:

- `@s1`: reordenar `NAV_ITEMS` en `Sidebar.constants.ts` (ej. mover "Configuración" primero) → el test falla en la primera aserción de orden.
- `@s2`: cambiar el texto de `ContractsPage`/`SettingsPage` de "Próximamente" a otro string → el test falla con "Unable to find an element with the text: Próximamente".
- `@s3`: quitar la prop `end` de los `NavLink` en `Sidebar.tsx` → `/rag` deja de ser el único con `aria-current` (por el comportamiento de prefijo de `NavLink`) y el test falla.
- `@s4`: cambiar el `onClick` del botón "Ayuda" para navegar a `ROUTES.CHAT` en vez de `ROUTES.FAQ` → el test falla al esperar `/faq` en `LocationDisplay`.
- `@s5`: invertir la condición en `handleThemeToggle` (`setTheme(isDark ? 'dark' : 'light')`) → el test falla esperando `data-theme="light"`.
- `@s6`: renderizar un `<Footer />` de prueba dentro de `AppShell` → `document.querySelector('footer')` deja de ser `null` y el test falla.

## Consecuencias de la migración cubiertas fuera del mapa anterior

Como consecuencia directa de reemplazar el header/footer viejos (ver `spec.md`, sección
"Consecuencia asumida" y decisiones 1, 11 y 17), se actualizaron también los tests de
features previas que ejercitaban elementos retirados por este cambio de arquitectura
(no agregan cobertura nueva de esta feature; documentan qué se adaptó y por qué):

- `tests/AppShell.test.tsx` — **eliminado**. Su cobertura (marca "Mercurial", `<header>`/`<main>` accesibles, `<main>` contiene `HrChat`) queda subsumida por `tests/DesignSystemShell.test.tsx` (`@s1`, `@s6`) contra la nueva estructura.
- `tests/HeaderPolish.test.tsx` — se quitan las aserciones sobre el subtítulo inline y el botón de engranaje (ambos retirados); se conservan las aserciones sobre el enlace de marca (href, aria-label, caduceo, navegación), ahora ubicado en el sidebar.
- `tests/VisualRedesign.test.tsx` — se quitan `@s1`, `@s2` y `@s4` (abrir/cerrar el menú de engranaje y el enlace a `/rag` dentro de ese menú), retirados por la decisión 17. Se conservan y adaptan los escenarios de persistencia/restauración de tema (`@s5`-`@s9`) y de ruteo (`@s11`, `@s12`).
- `tests/FaqSection.test.tsx` — se quitan las aserciones sobre el `<footer>` global (`@s1`, `@s2`, `@s3`, `@s15`, `@s16`, `@s17`), retirado por la decisión 11. Se conserva intacto el contenido propio de `FaqPage` (preguntas, respuestas, enlace "← Volver al chat").
- `tests/RagFormV2.test.tsx` — se removió un import sin usar (`MAX_FILE_COUNT`) que impedía el typecheck estricto (`noUnusedLocals`); no hay cambio de comportamiento ni de cobertura.

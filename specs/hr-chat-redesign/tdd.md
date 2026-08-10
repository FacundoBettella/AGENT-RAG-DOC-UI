# hr-chat-redesign — tdd.md

**Modo:** test-after (indicado por el `tech-lead`; también anotado en `feature_list.json` como
`"mode": "test-after"`).

Se implementó primero el fix de `hrService.query` (nuevo shape `{ answer, chunks }`, lectura de
`query_result.system_answer` / `query_result.chunks_related`), el `useHrChat` con `chunks` +
timestamps por intercambio, y la pantalla completa de `HrChat` migrada a Tailwind con el patrón
Container → subcomponentes presentacionales (`HrChat` como Container con Context, `ChatColumn` y
`ContextPanel` como consumidores, `MessageBubble` y `SourceCard` como ítems presentacionales puros).
Después se blindó cada escenario aprobado con uno o más tests concretos en `tests/HrChat.test.tsx`
y `tests/ApiIntegration.test.ts`. Cada test se verificó a mano rompiendo la implementación
correspondiente (ver "Verificación de mordida") antes de dejarlo asentado.

## Mapa `@s → test` (`features/hr-chat-redesign.feature`)

| Escenario | Test | Archivo |
|---|---|---|
| `@s1` hrService.query traduce la respuesta real del backend a `{ answer, chunks }` | `resuelve con answer leído de query_result.system_answer` y `el array chunks se lee de query_result.chunks_related` (grupo `@s2` de `api-integration.feature`, mismo contrato) — y a nivel de integración: `HrChat — @s1 el saludo persistente muestra la respuesta traducida de hrService > renderiza la respuesta de hrService.query cuando resuelve { answer, chunks }` | `tests/ApiIntegration.test.ts`, `tests/HrChat.test.tsx` |
| `@s2` hrService.query devuelve `chunks` vacío si no hay `chunks_related` | `chunks es un array vacío si el backend no envía chunks_related` | `tests/ApiIntegration.test.ts` |
| `@s3` hrService.query lanza Error si `system_answer` no es un string no vacío | `lanza Error si system_answer está ausente`, `lanza Error si system_answer es un string vacío`, `lanza Error si el payload no trae query_result` | `tests/ApiIntegration.test.ts` |
| `@s4` El saludo del asistente es la primera burbuja y permanece visible tras enviar una pregunta | `HrChat — @s4 el saludo del asistente permanece visible tras enviar una pregunta > el saludo sigue presente antes y después de enviar la pregunta` | `tests/HrChat.test.tsx` |
| `@s5` Cada burbuja muestra la hora de creación en formato 24h es-AR | `HrChat — @s5 cada burbuja muestra la hora de creación en formato 24h es-AR > la burbuja de la pregunta y la de la respuesta muestran la hora "09:05"` | `tests/HrChat.test.tsx` |
| `@s6` Un error de la API muestra el bubble de error con Reintentar | `HrChat — @s6 un error de la API muestra el bubble de error con Reintentar > muestra el texto de error y el botón Reintentar` | `tests/HrChat.test.tsx` |
| `@s7` Reintentar reenvía la última pregunta que falló | `HrChat — @s7 Reintentar reenvía la última pregunta que falló > llama a hrService.query con la última pregunta al hacer clic en Reintentar` | `tests/HrChat.test.tsx` |
| `@s8` El panel muestra una tarjeta por cada chunk, con la fuente tal cual llega | `HrChat — @s8 el panel muestra una tarjeta por cada chunk, con la fuente tal cual llega > muestra tarjetas con título "manual-rrhh.pdf", "api" y "Base de conocimiento"` | `tests/HrChat.test.tsx` |
| `@s9` El porcentaje de coincidencia se clampea a [0, 100] | `HrChat — @s9 el porcentaje de coincidencia se clampea a [0, 100] > muestra "100% de coincidencia" y "0% de coincidencia" para valores fuera de rango` | `tests/HrChat.test.tsx` |
| `@s10` Antes de la primera respuesta, el panel muestra su estado inicial | `HrChat — @s10 antes de la primera respuesta, el panel muestra su estado inicial > muestra "Los fragmentos que respalden la respuesta aparecerán acá."` | `tests/HrChat.test.tsx` |
| `@s11` Cuando la última respuesta no citó fragmentos, el panel muestra su estado sin fuentes | `HrChat — @s11 cuando la última respuesta no citó fragmentos, el panel muestra su estado sin fuentes > muestra "Esta respuesta no citó fragmentos de la base de conocimiento."` | `tests/HrChat.test.tsx` |
| `@s12` Durante la carga de una nueva pregunta, el panel conserva las fuentes del intercambio anterior | `HrChat — @s12 durante la carga de una nueva pregunta, el panel conserva las fuentes del intercambio anterior > sigue mostrando las tarjetas de fuentes del intercambio anterior mientras carga la nueva` | `tests/HrChat.test.tsx` |
| `@s13` Al hacer clic en una sugerencia, el texto se carga en el input y recibe foco sin enviarse | `HrChat — @s13 al hacer clic en una sugerencia, el texto se carga en el input y recibe foco sin enviarse > carga el texto de la sugerencia "Política de vacaciones" en el textarea, foco y sin llamar a query` | `tests/HrChat.test.tsx` |
| `@s14` Al hacer clic en una sugerencia se registra el evento chat_suggestion_clicked | `HrChat — @s14 al hacer clic en una sugerencia se registra el evento chat_suggestion_clicked > llama a analyticsService.trackEvent con el payload correcto` | `tests/HrChat.test.tsx` |

## Escenarios preservados/reescritos de la versión anterior (tabla "Tests existentes" de `spec.md`)

| Origen | Destino | Test |
|---|---|---|
| `@s2`-`@s15`, `@s17`, `@s19` de la versión previa de `tests/HrChat.test.tsx` | Preservados, mock adaptado a `{ answer, chunks }` | `foco automático`, `Enter envía`, `input se limpia y deshabilita`, `indicador de pensando`, `respuesta aparece; indicador desaparece`, `input se rehabilita y recupera foco`, `Shift+Enter`, `no envía vacío`/`solo espacios`, `error + Reintentar` (x2), `scroll automático`, `doble envío`, `pregunta de 501 caracteres`, `bubble de pregunta en vuelo` | `tests/HrChat.test.tsx` |
| `@s1`/`@s18` (welcome centrado que desaparece) | Reemplazados por saludo persistente | `@s4` de esta feature | `tests/HrChat.test.tsx` |
| `@s16` (`overflow-wrap` vía `ServerStyleSheet`) | Reescrito sin styled-components | `respuesta larga no desborda el bubble > la burbuja de mensaje usa whitespace-pre-wrap y break-words` | `tests/HrChat.test.tsx` |
| `@s1`-`@s6` de `tests/ApiIntegration.test.ts` (hrService) | Preservados; mocks de éxito devuelven `{ data: { query_result: … } }` | `@s1`, `@s2` (con los 6 tests nuevos de payload), `@s3`-`@s6` | `tests/ApiIntegration.test.ts` |
| `@s7`-`@s15` de `tests/ApiIntegration.test.ts` (ragService) | Intactos, no se tocaron | — | `tests/ApiIntegration.test.ts` |
| `tests/analyticsHooks.test.ts` (`useHrChat` — @s1, @s2, @s3, @s10, @s11) | Mock de `hrService.query` adaptado a `{ answer, chunks }` (mismo comportamiento, sin cambio de cobertura) | sin cambios de escenario | `tests/analyticsHooks.test.ts` |

## Verificación de mordida (cada test falla si se rompe la implementación)

Verificado a mano, revirtiendo temporalmente el cambio correspondiente y confirmando el fallo:

- `@s1`/`@s3` (hrService): reemplazar la condición `typeof answer !== 'string' || answer.trim() === ''`
  por `false` en `hrService.ts` → 3 tests de `tests/ApiIntegration.test.ts` (`@s2` payload
  ausente/vacío/sin `query_result`) fallan porque la promesa resuelve en vez de rechazar.
- `@s9` (clamp de similarity): quitar el `Math.min(1, Math.max(0, …))` de `toSimilarityPercent` en
  `HrChat.utils.ts` → el test de `@s9` falla esperando "100%"/"0%" y encontrando "120%"/"-30%".
- `@s14` (evento de analytics): quitar la llamada a `analyticsService.trackEvent` en
  `handleSuggestionClick` (`HrChat.tsx`) → el test de `@s14` falla, `trackEvent` no fue llamado.
- `@s12` (panel conserva fuentes durante la carga): cambiar `hasExchanges` a
  `exchanges.length > 0 && !isLoading` en `HrChat.tsx` → el test de `@s12` falla, la tarjeta
  `doc-previo.pdf` desaparece del panel apenas empieza a cargar la segunda pregunta.
- `@s4` (saludo persistente): condicionar el saludo a `exchanges.length === 0` en `ChatColumn.tsx`
  → el test de `@s4` falla, el saludo desaparece después de la primera respuesta.

## Consecuencias fuera del mapa anterior

- Se agregó `hour12: false` explícito a `formatMessageTime` (`HrChat.utils.ts`). El
  `toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })` de la spec, sin ese flag,
  resuelve en este runtime (Node/ICU) a formato 12 horas con sufijo "a. m."/"p. m." en vez de las 24
  horas que la spec pide explícitamente ("24 h, p. ej. 09:05"); `hour12: false` es la forma de
  cumplir la intención literal de la spec en este entorno, no un cambio de alcance.
- `src/features/HrChat/HrChat.styles.ts` se eliminó (Decisión "Consecuencia asumida" de `spec.md`).
- `tests/analyticsHooks.test.ts` — se adaptaron 3 mocks de `hrService.query` (de `string` a
  `{ answer, chunks }`) para que el suite siga compilando y en verde; no agrega ni quita cobertura de
  esta feature.

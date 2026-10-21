# hr-chat-feedback — testing

**Modo:** TDD estricto

Suite completa: 349 tests verdes (317 previos + 32 nuevos), `tsc --noEmit` limpio, `./init.sh` verde.
Corre en el contenedor `dev` (Vitest + RTL + jsdom).

Archivos de test:

- `tests/ApiIntegration.test.ts` — contrato de `hrService` (@s1–@s4), mockeando `axios`.
- `tests/HrChatFeedback.test.tsx` — UI y estado a nivel de `<HrChat />` con `hrService` mockeado (@s5–@s16) y guardas de `useHrChat`.
- `tests/HrChat.test.tsx`, `tests/analyticsHooks.test.ts` — solo se les sumó `traceId: null` a los mocks de `hrService.query`; la intención de sus escenarios no cambió.

## Mapa @s → test

| @s | Test | Archivo |
|---|---|---|
| @s1 | `hrService — hr-chat-feedback @s1: devuelve el trace_id válido tal cual llega` | ApiIntegration.test.ts |
| @s2 | `hrService — hr-chat-feedback @s2: normaliza a null …` (`it.each`: ausente, null, vacío, mayúsculas, <32, >32, no hex, no string). Además `@s2: resuelve con un objeto { answer, chunks }` (preexistente) pasó a esperar `traceId: null` | ApiIntegration.test.ts |
| @s3 | `hrService — hr-chat-feedback @s3: sendFeedback envía el voto …` (POST + body + timeout 15000, resuelve `undefined`; y 2xx sin validar body) | ApiIntegration.test.ts |
| @s4 | `hrService — hr-chat-feedback @s4: sendFeedback lanza siempre el mismo error genérico` (`it.each`: 422, 503, 500, red, timeout; mensaje exacto, instancia de `Error`, sin texto del backend) | ApiIntegration.test.ts |
| @s5 | `hr-chat-feedback @s5 — una respuesta con trace_id muestra el par de botones agrupado y accesible` | HrChatFeedback.test.tsx |
| @s6 | `hr-chat-feedback @s6 — una respuesta con traceId null no muestra botones de voto` | HrChatFeedback.test.tsx |
| @s7 | `hr-chat-feedback @s7 — el saludo inicial no muestra botones de voto` | HrChatFeedback.test.tsx |
| @s8 | `hr-chat-feedback @s8 — votar marca el pulgar de inmediato y deshabilita el par mientras se envía` | HrChatFeedback.test.tsx |
| @s9 | `hr-chat-feedback @s9 — al confirmarse el voto el par se rehabilita y el voto queda marcado` | HrChatFeedback.test.tsx |
| @s10 | `hr-chat-feedback @s10 — hacer clic en el pulgar ya elegido no hace nada` | HrChatFeedback.test.tsx |
| @s11 | `hr-chat-feedback @s11 — cambiar de opinión envía un nuevo POST con el mismo trace_id` | HrChatFeedback.test.tsx |
| @s12 | `hr-chat-feedback @s12 — si el primer voto falla se revierte a sin voto y se muestra el error genérico` | HrChatFeedback.test.tsx |
| @s13 | `hr-chat-feedback @s13 — si un cambio de voto falla se vuelve a ver el último voto confirmado` | HrChatFeedback.test.tsx |
| @s14 | `hr-chat-feedback @s14 — un voto exitoso posterior a un error hace desaparecer el mensaje` | HrChatFeedback.test.tsx |
| @s15 | `hr-chat-feedback @s15 — el voto de una respuesta no altera el de otra` | HrChatFeedback.test.tsx |
| @s16 | `hr-chat-feedback @s16 — se puede votar mientras se procesa una nueva pregunta sin afectar la consulta` (el texto del input llega por una sugerencia, porque el textarea está deshabilitado en vuelo) | HrChatFeedback.test.tsx |

## Tests adicionales (no mapean a un @s)

| Test | Qué verifica |
|---|---|
| `useHrChat.sendFeedback ignora … con traceId null` | Guarda del contrato de estado: sin request ni cambio de estado |
| `useHrChat.sendFeedback ignora … con un envío en curso` | Guarda `isSending`: un segundo voto no sale |
| `useHrChat.sendFeedback … no emite ningún evento de analytics al votar` | Decisión 17: sin evento nuevo |
| `votar una respuesta no mueve el scroll del chat` | Regresión descubierta en TDD: el efecto de scroll dependía de `exchanges` y votar scrolleaba al fondo; ahora depende de `exchanges.length` |

## Verificación de que los tests muerden

Los escenarios que pasaron en verde a la primera (@s6, @s7, @s11, @s13, @s14, @s15, @s16) se verificaron con mutaciones manuales sobre la producción (restauradas después):

- @s6: quitar el guard `traceId !== null` en `ChatColumn` -> falla. @s7 no se puede mutar sin agregar botones al saludo: pasa por construcción y queda como guarda de regresión.
- @s13: rollback a `null` en lugar de `confirmedVote` -> falla.
- @s14: no limpiar `hasError` al confirmar -> falla.
- @s15: aplicar el patch a todos los intercambios -> falla.
- @s16: limpiar el input al votar -> falla.
- @s11: enviar siempre `true` -> falla.
- @s8: quitar `disabled` de los botones -> falla.
- Guardas del hook: quitar `isSending` o la guarda de `traceId === null` -> falla.

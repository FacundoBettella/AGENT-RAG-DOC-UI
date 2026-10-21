# Review — feature 19 hr-chat-feedback

**Veredicto:** APPROVED

## Cobertura de escenarios (@s ↔ test)
- @s1..@s4: [x] `tests/ApiIntegration.test.ts` (trace_id válido; it.each malformados; POST + body + timeout 15000; it.each de fallas con mensaje exacto y sin texto del backend).
- @s5..@s7: [x] `tests/HrChatFeedback.test.tsx` (grupo accesible, title, aria-pressed, sin alert; traceId null; saludo).
- @s8..@s11: [x] voto inmediato + disabled + aria-busy; rehabilitación; clic en voto elegido sin request; cambio de voto con mismo trace_id.
- @s12..@s14: [x] rollback a sin voto, rollback al último confirmado, limpieza del alert.
- @s15, @s16: [x] independencia entre respuestas; voto con consulta en vuelo, input intacto.

## Disciplina de testing (Modo: TDD estricto)
- ¿Producción sin test que la pida? NO. Cada pieza (ruta, normalizeTraceId, sendFeedback, estado, FeedbackButtons, guard en ChatColumn) está exigida por un test.
- ¿Evidencia de Rojo→Verde→Refactor? SÍ (testing.md registra mutaciones sobre los @s verdes de entrada).

## Desvíos declarados
1. `exchanges` -> `exchanges.length` en el efecto de scroll de ChatColumn: aceptable. Es un fix mínimo necesario para que votar no mueva el scroll, con test de regresión.
2. Tests extra (guardas de traceId null e isSending, sin analytics, scroll): aceptables. Cubren reglas de la spec (estado, Decisión 17).
3. @s16 carga el texto por sugerencia: aceptable. El textarea está deshabilitado en vuelo y la aserción sigue siendo "el input no cambia".

## Calidad
- Error genérico sin texto del backend: `hrService.ts` usa catch sin `extractBackendError`. Correcto.
- Sin evento de analytics nuevo. Correcto.
- Accesibilidad conforme a la spec: `role=group` con aria-label, `aria-busy`, `aria-pressed`, aria-label y title, íconos `aria-hidden`, `role=alert`, `disabled:opacity-50`, `focus-visible` ring.
- Sin console.log. Textos y ruta en constantes. Servicio en `services/`, FeedbackButtons presentacional, barrels actualizados.
- Observación menor, no bloqueante: `aria-busy={false}` renderiza `"false"`. La spec lo permite ("ausente o false").

## Checkpoints
- C1: [x] (`./init.sh` verde, 20 archivos y 349 tests pasan)
- C2: [x]
- C3: [x]
- C4: [x]
- C5: [x]
- C6: [x]

## Cambios requeridos
Ninguno.

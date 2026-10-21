# hr-chat-feedback — spec

> Estado: **cerrada**. Sin preguntas abiertas. Lista para destilar Gherkin.
>
> Contrato de backend (fijo, no se negocia): `specs/hr-chat-feedback/api-contract.md`.
> Precedentes: `specs/hr-chat-redesign/spec.md` (layout del chat, `hrService`, Container),
> `specs/brand-restyle/spec.md` (tokens vigentes), `specs/design-system-shell/spec.md`,
> `specs/contract-analysis/spec.md`, `specs/prompts-config/spec.md`,
> `specs/rag-domain-metadata/spec.md`. Lo heredado se cita por referencia; esta spec solo
> declara lo que agrega o cambia.

## Propósito

Permitir valorar cada respuesta del asistente de RR.HH. como útil o no útil y registrar ese voto en la RAG API (`POST /api/feedback`).

## Contrato

### Alcance

**Dentro:**

- `src/constants/apiRoutes.ts` — se agrega `FEEDBACK: '/api/feedback'`.
- `src/services/hrService.ts` — `HrAnswer` suma `traceId`; nuevo método `sendFeedback`.
- `src/hooks/useHrChat.ts` — `Exchange` suma `traceId` y `feedback`; nueva acción `sendFeedback`.
- `src/features/HrChat/` — contexto expone `sendFeedback`; nuevo presentacional
  `components/FeedbackButtons/` (`FeedbackButtons.tsx`, `FeedbackButtons.types.ts`, `index.ts`);
  `ChatColumn` lo renderiza bajo cada respuesta; textos nuevos en `HrChat.constants.ts`.

**Fuera:** persistencia del voto entre recargas, deshacer un voto, comentario libre junto al
voto, evento de analytics (Decisión 17), cambios al saludo, al panel de contexto y al resto
del layout.

### Entradas

- **Backend**: `POST {getRagBaseUrl()}/api/query` — `query_result.trace_id`:
  string hex de 32 caracteres en minúscula, o `null` (contrato §1).
- **Backend**: `POST {getRagBaseUrl()}/api/feedback`, body `{ trace_id, helpful }`
  → 200 / 422 / 503 / 500 (contrato §2).
- **Mockup**: ninguno.

### `hrService`

```ts
export interface HrAnswer {
  answer: string
  chunks: HrChunk[]
  traceId: string | null
}

query(question: string): Promise<HrAnswer>            // contrato existente + traceId
sendFeedback(traceId: string, helpful: boolean): Promise<void>
```

**`query` — `traceId`:**

- Si `query_result.trace_id` es un string que matchea `^[0-9a-f]{32}$` → ese mismo valor, sin
  tocar.
- En cualquier otro caso (ausente, `null`, vacío, mayúsculas, largo distinto, no string) →
  `null`. La respuesta se entrega igual; no se lanza error (Decisión 2).
- Todo lo demás de `query` no cambia.

**`sendFeedback`:**

- `POST {getRagBaseUrl()}${API_ROUTES.FEEDBACK}` con body `{ trace_id: traceId, helpful }`,
  `timeout: 15_000`.
- Cualquier 2xx → resuelve `void`. El body de respuesta no se valida (Decisión 15).
- 422, 503, 500, error de red o timeout → lanza
  `Error('No se pudo registrar tu voto. Intentá de nuevo.')`. Nunca propaga el texto del
  backend; no usa `extractBackendError` (Decisión 11).

| Código | Causa (contrato §2) | Resultado |
|---|---|---|
| 200 | voto registrado | resuelve |
| 422 | body inválido | `Error` genérico |
| 503 | tracing apagado en el server | `Error` genérico (Decisión 21) |
| 500 | falló el envío a Langfuse | `Error` genérico |
| — | red / timeout / CORS | `Error` genérico |

### Estado (`useHrChat`)

```ts
export interface ExchangeFeedback {
  vote: boolean | null          // voto que muestra la UI (true = útil, false = no útil)
  confirmedVote: boolean | null // último voto que recibió 2xx
  isSending: boolean
  hasError: boolean
}

export interface Exchange {
  question: string
  answer: string
  chunks: HrChunk[]
  askedAt: number
  answeredAt: number
  traceId: string | null
  feedback: ExchangeFeedback
}

sendFeedback: (index: number, helpful: boolean) => Promise<void>
```

- Al crear un `Exchange`: `traceId` del `HrAnswer`; `feedback` =
  `{ vote: null, confirmedVote: null, isSending: false, hasError: false }`.
- `sendFeedback(index, helpful)`:
  - **No hace nada** (ni request ni cambio de estado) si `traceId === null`, si
    `isSending === true` o si `helpful === vote`.
  - Si no: `vote = helpful`, `isSending = true` (el error previo, si lo hay, se mantiene) y
    llama a `hrService.sendFeedback(traceId, helpful)`.
  - Al resolver: `confirmedVote = helpful`, `isSending = false`, `hasError = false`.
  - Al fallar: `vote = confirmedVote` (rollback), `isSending = false`, `hasError = true`.
- Cada `Exchange` tiene su propio `feedback`: votar en uno no altera otro.
- Votar no toca `isLoading`, `error`, `pendingQuestion` ni `inputValue`, y funciona mientras
  hay una consulta en vuelo (Decisión 10).
- El voto vive solo en memoria; se pierde al recargar junto con el historial (Decisión 9).

### Salidas (UI)

**Dónde:** debajo de la burbuja del asistente de cada intercambio cuyo `traceId !== null`,
alineado a la izquierda con la burbuja (`pl-12`, misma sangría que el indicador de carga).
El saludo inicial y los intercambios con `traceId === null` **no** renderizan nada (ni botones
ni contenedor).

**Estructura de `FeedbackButtons`** (presentacional, recibe por props el `feedback` del
intercambio y un `onVote(helpful)`):

| Elemento | Contrato |
|---|---|
| Contenedor | `role="group"`, `aria-label="¿Te sirvió esta respuesta?"`; `aria-busy="true"` mientras `isSending`, ausente o `"false"` si no |
| Botón útil | `<button type="button">`, `aria-label="Respuesta útil"`, `title="Respuesta útil"`, ícono `thumb_up` |
| Botón no útil | `<button type="button">`, `aria-label="Respuesta no útil"`, `title="Respuesta no útil"`, ícono `thumb_down` |
| Íconos | `material-symbols-outlined`, `aria-hidden="true"` |
| `aria-pressed` | útil: `vote === true`; no útil: `vote === false` (ambos `false` si `vote === null`) |
| `disabled` | ambos botones mientras `isSending` |
| Error | si `hasError`: `<p role="alert">` con "No se pudo registrar tu voto. Intentá de nuevo.", debajo del par; `text-xs text-error` |

**Estilo:**

- No seleccionado: ícono con contorno, `text-on-surface-variant`.
- Seleccionado (`aria-pressed="true"`): ícono relleno (`font-variation-settings: 'FILL' 1`),
  `text-primary`.
- Deshabilitado: `disabled:opacity-50`.
- Foco: anillo `:focus-visible` (hereda la tabla de estados de `design-system-shell`).
- Sin etiqueta visible, sin texto de confirmación ("¡Gracias!") (Decisión 22).
- Los botones se ven siempre, no dependen de hover (Decisión 8).

**Comportamiento observable:**

| Acción | Resultado |
|---|---|
| Clic en un pulgar no seleccionado | queda seleccionado de inmediato, el par se deshabilita, sale un POST con `helpful` correspondiente |
| 2xx | el par se rehabilita, el voto queda seleccionado, desaparece el error si lo había |
| Error (cualquiera) | el par se rehabilita, vuelve a verse el último voto confirmado (o ninguno), aparece el mensaje de error |
| Clic en el pulgar ya seleccionado | nada: sin request, sigue seleccionado |
| Clic en el otro pulgar (cambio de opinión) | mismo flujo, nuevo POST con el `trace_id` de esa respuesta |
| Reintento tras error | re-clic en el pulgar deseado; no hay botón "Reintentar" |

**Textos nuevos en `HrChat.constants.ts`:** `"¿Te sirvió esta respuesta?"`,
`"Respuesta útil"`, `"Respuesta no útil"`,
`"No se pudo registrar tu voto. Intentá de nuevo."`.

### Analytics

Sin cambios. No se agrega `EventName` (Decisión 17).

### Tests existentes afectados

- `tests/ApiIntegration.test.ts` — el `toEqual({ answer, chunks: [] })` de `query` pasa a
  incluir `traceId` (`null` cuando el payload no lo trae). Se agregan los casos de
  `trace_id` válido, `null` y malformado.
- `tests/HrChat.test.tsx` y `tests/analyticsHooks.test.ts` — los mocks de `hrService.query`
  suman `traceId: null`; la intención de los escenarios no cambia.

## Decisiones

1. **Con `trace_id` null no se renderizan los botones.** Lo recomienda el contrato §1. Hereda Decisión 14 (sin UI muerta) de `specs/hr-chat-redesign/spec.md`. *Descartada:* botones deshabilitados — prometen una función que no existe.
2. **Un `trace_id` con formato inválido se normaliza a `null`; la respuesta se muestra igual.** Mandarlo garantiza un 422. *Descartada:* lanzar `Error` como con `system_answer` — descarta una respuesta válida por un campo de telemetría.
3. **El saludo no lleva botones.** No sale de `/api/query`, así que no tiene `trace_id`. *Descartada:* botones en todas las burbujas del asistente.
4. Íconos `thumb_up`/`thumb_down`, no emoji: hereda Decisión 4 (fuentes e iconos self-hosted, Material Symbols) de `specs/design-system-shell/spec.md`.
5. **Seleccionado = ícono relleno en `text-primary`.** Hereda Decisiones 7 y 14 (`primary` legible en ambos temas; `accent` invisible en light) de `specs/brand-restyle/spec.md`. *Descartada:* `accent` — el amarillo no se ve en el tema claro.
6. **Sin deshacer: clic sobre el voto ya elegido no hace nada.** El backend no permite borrar votos; desmarcar en la UI mentiría. Cambiar de opinión = votar el otro (contrato §2). *Descartada:* toggle-off local.
7. **Toggle ARIA: `aria-pressed` + `aria-label`, dentro de `role="group"` con etiqueta.** Es el patrón accesible para botones con estado y el que ya usa "Enviar" (label + ícono oculto). *Descartada:* checkbox/radio estilizado — semántica de formulario sin formulario.
8. **Botones siempre visibles, no solo en hover.** El hover no existe con teclado ni en táctil, y no es verificable en jsdom (criterio de Decisión 19 de `hr-chat-redesign`). *Descartada:* aparición al pasar el mouse.
9. Voto solo en memoria, se pierde al recargar: hereda Decisión 10 (sin historial persistido) de `specs/contract-analysis/spec.md`.
10. **Se puede votar mientras hay una consulta en vuelo.** Son requests independientes; el bloqueo del input evita el doble envío de preguntas (@s15), no aplica a votos. *Descartada:* deshabilitar todos los votos durante la carga.
11. Error siempre genérico, nunca el texto del backend: hereda Decisión 6 (422 al mensaje genérico) de `specs/contract-analysis/spec.md`; el contrato §2 lo pide para 422/500 y el 503 también es jerga técnica.
12. `sendFeedback` vive en `hrService`: hereda Decisión 19 (services por dominio, no por host) de `specs/prompts-config/spec.md`.
13. `FEEDBACK` en `src/constants/apiRoutes.ts`: hereda Decisión 23 (endpoints en `apiRoutes`) de `specs/hr-chat-redesign/spec.md`.
14. `traceId` en camelCase: hereda Decisión 23 (sin snake_case en la UI) de `specs/contract-analysis/spec.md`.
15. **Cualquier 2xx es éxito; no se valida el body.** Es un eco del request y no aporta información. *Descartada:* validar el eco como payload — agrega un modo de falla sin ganancia.
16. `timeout: 15_000` en `sendFeedback`: hereda Decisión 4 (endpoints sin LLM) de `specs/prompts-config/spec.md`.
17. Sin evento de analytics: hereda Decisión 13 (sin pregunta de producto no hay evento) de `specs/rag-domain-metadata/spec.md`; además el voto ya queda en Langfuse.
18. Estado del voto en `useHrChat`, `FeedbackButtons` presentacional: hereda Decisión 21 (Container + presentacionales) de `specs/hr-chat-redesign/spec.md`.
19. **Marcado inmediato, par deshabilitado hasta la respuesta y rollback al último voto confirmado si falla.** Feedback instantáneo sin carrera entre POSTs en vuelo. *Descartadas:* optimista sin bloqueo — Langfuse puede quedar con el voto viejo; esperar el 200 — sin feedback durante el envío.
20. **Error inline bajo el par, por respuesta, `role="alert"`; desaparece con el próximo voto exitoso; reintento = re-clic.** Hereda Decisión 16 (sin toast) de `hr-chat-redesign`. *Descartada:* reusar el bubble de error del chat — está atado a la pregunta y su "Reintentar".
21. **El 503 se trata como cualquier otro error.** Solo ocurre si el server se reinició sin tracing entre la respuesta y el voto: caso raro. *Descartada:* ocultar los botones con "valoraciones no disponibles" — estado extra por un caso marginal.
22. **Solo íconos: sin etiqueta visible ni "¡Gracias!".** El texto repetido en cada respuesta del historial es ruido; relleno + `aria-pressed` ya confirman. *Descartada:* etiqueta "¿Te sirvió?" visible y confirmación textual.

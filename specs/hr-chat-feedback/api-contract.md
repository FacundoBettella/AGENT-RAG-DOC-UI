# Contrato de API — hr-chat-feedback

> Fuente: equipo de RAG AGENT API (feature `answer-feedback`), entregado por el humano el 2026-10-21.
> Copia textual del contrato. No editar sin una nueva versión del backend.

## 1. Cambio en `POST /api/query`

`query_result` suma un campo, `trace_id`. Lo demás no cambia.

```json
{
  "query_result": {
    "user_question": "...",
    "system_answer": "...",
    "chunks_related": [ ... ],
    "intent": "hr",
    "reasoning": "...",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736"
  }
}
```

- `trace_id` es un string de 32 caracteres hex en minúscula, o `null` si el tracing está apagado.
- El front tiene que guardar ese valor junto a cada respuesta, porque es lo que identifica la respuesta cuando el usuario vota.
- Si viene `null`, conviene no mostrar los botones de voto, porque el voto no se va a poder registrar.

## 2. Nuevo `POST /api/feedback`

### Request

```json
{ "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "helpful": true }
```

| Campo      | Tipo    | Regla |
|------------|---------|-------|
| `trace_id` | string  | Obligatorio. Se manda el mismo valor que vino en `/api/query`, sin tocarlo: tiene que ser exactamente `^[0-9a-f]{32}$`. |
| `helpful`  | boolean | Obligatorio. `true` = útil, `false` = no útil. |

### Respuestas

| Status | Body | Cuándo |
|--------|------|--------|
| 200 | `{"feedback_result": {"trace_id": "...", "helpful": true}}` | El voto se registró. |
| 422 | `{"error": "<detalle técnico>"}` | Falta un campo, `helpful` no es booleano o el `trace_id` tiene mal formato. |
| 503 | `{"error": "Tracing deshabilitado: el feedback no se registró"}` | El tracing está apagado en el server. |
| 500 | `{"error": "..."}` | Falló el envío a Langfuse. |

### Comportamiento a tener en cuenta

- Re-votar está permitido. Si el usuario cambia de opinión, se manda otro POST con el mismo `trace_id`. El último voto reemplaza al anterior y queda un solo voto por respuesta.
- No hay autenticación, igual que en el resto de la API.
- El texto del 422 y del 500 no es para mostrarle al usuario. El de 422 es el detalle técnico de la validación. Mejor mostrar un mensaje genérico del lado del front.
- Un 200 no garantiza que la respuesta exista. Se valida solo el formato del `trace_id`, no que esa respuesta exista en Langfuse.

Feature: Feedback útil / no útil sobre cada respuesta del asistente de RR.HH.
  Como empleado quiero valorar cada respuesta del asistente como útil o no útil
  para que mi voto quede registrado en la RAG API y se pueda mejorar la calidad de las respuestas.

  # ─── Contrato de datos: hrService.query (trace_id) ──────────────────────────

  @s1
  Scenario: hrService.query devuelve el trace_id válido tal cual llega
    Given que el backend responde HTTP 200 con query_result.system_answer "Tenés 21 días de vacaciones." y query_result.trace_id "4bf92f3577b34da6a3ce929d0e0e4736"
    When se llama a hrService.query con cualquier pregunta
    Then la promesa resuelve con traceId igual a "4bf92f3577b34da6a3ce929d0e0e4736"
    And answer sigue siendo "Tenés 21 días de vacaciones."

  @s2
  Scenario: hrService.query normaliza a null un trace_id ausente, null o mal formado y entrega la respuesta igual
    Given que el backend responde HTTP 200 con query_result.system_answer "Respuesta válida." y query_result.trace_id ausente, null, vacío, en mayúsculas, de largo distinto de 32 o no string
    When se llama a hrService.query con cualquier pregunta
    Then la promesa resuelve con traceId igual a null
    And answer es "Respuesta válida."

  # ─── Contrato de datos: hrService.sendFeedback ──────────────────────────────

  @s3
  Scenario: hrService.sendFeedback envía el voto a /api/feedback y resuelve ante un 2xx
    Given que el backend responde HTTP 200 a POST /api/feedback
    When se llama a hrService.sendFeedback con "4bf92f3577b34da6a3ce929d0e0e4736" y true
    Then se hace un POST a "{base}/api/feedback" con el body { trace_id: "4bf92f3577b34da6a3ce929d0e0e4736", helpful: true } y timeout de 15000 ms
    And la promesa resuelve sin valor

  @s4
  Scenario Outline: hrService.sendFeedback lanza siempre el mismo error genérico ante cualquier falla
    Given que POST /api/feedback falla con <falla>
    When se llama a hrService.sendFeedback con "4bf92f3577b34da6a3ce929d0e0e4736" y false
    Then la promesa es rechazada con un Error cuyo mensaje es "No se pudo registrar tu voto. Intentá de nuevo."
    And el mensaje no contiene el texto de error enviado por el backend

    Examples:
      | falla                                                |
      | HTTP 422 con {"error": "detalle técnico"}            |
      | HTTP 503 con {"error": "Tracing deshabilitado"}      |
      | HTTP 500 con {"error": "falló Langfuse"}             |
      | un error de red                                      |
      | un timeout                                           |

  # ─── Visibilidad de los botones ─────────────────────────────────────────────

  @s5
  Scenario: Una respuesta con trace_id muestra el par de botones agrupado y accesible, sin voto marcado
    Given que el componente HrChat se renderiza con hrService mockeado (query éxito con traceId "4bf92f3577b34da6a3ce929d0e0e4736")
    When el usuario envía una pregunta y la API responde
    Then se muestra un grupo con nombre accesible "¿Te sirvió esta respuesta?"
    And dentro del grupo hay un botón "Respuesta útil" y un botón "Respuesta no útil", ambos con title igual a su nombre
    And ambos botones tienen aria-pressed "false" y están habilitados
    And no se muestra ningún mensaje con rol alert

  @s6
  Scenario: Una respuesta con traceId null no muestra botones de voto
    Given que el componente HrChat se renderiza con hrService mockeado (query éxito con traceId null)
    When el usuario envía una pregunta y la API responde
    Then se muestra el texto de la respuesta
    And no existe ningún grupo "¿Te sirvió esta respuesta?"
    And no existen los botones "Respuesta útil" ni "Respuesta no útil"

  @s7
  Scenario: El saludo inicial no muestra botones de voto
    Given que el componente HrChat se renderiza sin intercambios previos
    When se muestra el saludo del asistente
    Then no existe ningún grupo "¿Te sirvió esta respuesta?"
    And no existen los botones "Respuesta útil" ni "Respuesta no útil"

  # ─── Votar ──────────────────────────────────────────────────────────────────

  @s8
  Scenario: Votar marca el pulgar de inmediato y deshabilita el par mientras se envía
    Given que el componente HrChat tiene una respuesta con traceId "4bf92f3577b34da6a3ce929d0e0e4736" y hrService.sendFeedback queda pendiente
    When el usuario hace clic en "Respuesta útil"
    Then se llama a hrService.sendFeedback con "4bf92f3577b34da6a3ce929d0e0e4736" y true
    And "Respuesta útil" tiene aria-pressed "true" y "Respuesta no útil" tiene aria-pressed "false"
    And ambos botones están deshabilitados y el grupo tiene aria-busy "true"

  @s9
  Scenario: Al confirmarse el voto el par se rehabilita y el voto queda marcado
    Given que el componente HrChat tiene una respuesta con traceId válido y el usuario hizo clic en "Respuesta útil" con hrService.sendFeedback pendiente
    When hrService.sendFeedback resuelve
    Then ambos botones están habilitados y el grupo no tiene aria-busy "true"
    And "Respuesta útil" tiene aria-pressed "true"
    And no se muestra ningún mensaje con rol alert

  @s10
  Scenario: Hacer clic en el pulgar ya elegido no hace nada
    Given que el componente HrChat tiene una respuesta cuyo voto "Respuesta útil" ya fue confirmado
    When el usuario hace clic en "Respuesta útil"
    Then no se llama de nuevo a hrService.sendFeedback
    And "Respuesta útil" sigue con aria-pressed "true"

  @s11
  Scenario: Cambiar de opinión envía un nuevo POST con el mismo trace_id
    Given que el componente HrChat tiene una respuesta con traceId "4bf92f3577b34da6a3ce929d0e0e4736" cuyo voto "Respuesta útil" ya fue confirmado
    When el usuario hace clic en "Respuesta no útil"
    Then se llama a hrService.sendFeedback con "4bf92f3577b34da6a3ce929d0e0e4736" y false
    And al resolver "Respuesta no útil" tiene aria-pressed "true" y "Respuesta útil" tiene aria-pressed "false"

  # ─── Errores y reintento ────────────────────────────────────────────────────

  @s12
  Scenario: Si el primer voto falla se revierte a sin voto y se muestra el error genérico
    Given que el componente HrChat tiene una respuesta con traceId válido sin voto previo y hrService.sendFeedback rechaza con "No se pudo registrar tu voto. Intentá de nuevo."
    When el usuario hace clic en "Respuesta útil"
    Then se muestra un mensaje con rol alert y el texto "No se pudo registrar tu voto. Intentá de nuevo."
    And ambos botones tienen aria-pressed "false" y están habilitados

  @s13
  Scenario: Si un cambio de voto falla se vuelve a ver el último voto confirmado
    Given que el componente HrChat tiene una respuesta cuyo voto "Respuesta útil" ya fue confirmado y hrService.sendFeedback rechaza en el siguiente intento
    When el usuario hace clic en "Respuesta no útil"
    Then "Respuesta útil" vuelve a tener aria-pressed "true" y "Respuesta no útil" aria-pressed "false"
    And se muestra un mensaje con rol alert y el texto "No se pudo registrar tu voto. Intentá de nuevo."

  @s14
  Scenario: Un voto exitoso posterior a un error hace desaparecer el mensaje
    Given que el componente HrChat tiene una respuesta que muestra el mensaje de error de voto y hrService.sendFeedback ahora resuelve
    When el usuario vuelve a hacer clic en "Respuesta útil"
    Then al resolver deja de mostrarse el mensaje con rol alert
    And "Respuesta útil" tiene aria-pressed "true"

  # ─── Independencia entre respuestas y con la consulta ───────────────────────

  @s15
  Scenario: El voto de una respuesta no altera el de otra
    Given que el componente HrChat tiene dos respuestas con traceId distintos y ninguna votada
    When el usuario hace clic en "Respuesta útil" de la primera respuesta
    Then se llama a hrService.sendFeedback con el traceId de la primera respuesta y true
    And los botones de la segunda respuesta siguen con aria-pressed "false" y habilitados

  @s16
  Scenario: Se puede votar mientras se procesa una nueva pregunta sin afectar la consulta
    Given que el componente HrChat tiene una respuesta con traceId válido y una nueva pregunta en vuelo (hrService.query pendiente) con texto en el input
    When el usuario hace clic en "Respuesta útil" de la respuesta anterior
    Then se llama a hrService.sendFeedback con el traceId de esa respuesta y true
    And la pregunta en vuelo sigue pendiente y el indicador de carga sigue visible
    And el contenido del input no cambia

Feature: Rediseño del chat de RR.HH. — burbujas MD3, panel de fuentes reales y fix de hrService.query
  Como empleado de Mercurial quiero conversar con el asistente de RR.HH. y ver de qué
  fragmentos de la base de conocimiento sale cada respuesta, para confiar en la
  información y saber qué más puedo preguntar.

  # ─── Contrato de datos: hrService.query (el fix) ───────────────────────────

  @s1
  Scenario: hrService.query traduce la respuesta real del backend a { answer, chunks }
    Given que el backend responde HTTP 200 con query_result.system_answer "Tenés 21 días de vacaciones." y query_result.chunks_related con un chunk { content: "Política de licencias...", source: "manual-rrhh.pdf", similarity: 0.87 }
    When se llama a hrService.query con cualquier pregunta
    Then la promesa resuelve con answer igual a "Tenés 21 días de vacaciones."
    And chunks contiene un elemento con content "Política de licencias...", source "manual-rrhh.pdf" y similarity 0.87

  @s2
  Scenario: hrService.query devuelve un array de chunks vacío si el backend no envía chunks_related
    Given que el backend responde HTTP 200 con query_result.system_answer "Respuesta sin fuentes." y sin el campo chunks_related
    When se llama a hrService.query con cualquier pregunta
    Then la promesa resuelve con chunks igual a un array vacío

  @s3
  Scenario: hrService.query lanza un error si system_answer no es un string no vacío
    Given que el backend responde HTTP 200 con query_result.system_answer ausente o vacío
    When se llama a hrService.query con cualquier pregunta
    Then la promesa es rechazada con un Error

  # ─── Saludo persistente y hora de cada burbuja ──────────────────────────────

  @s4
  Scenario: El saludo del asistente es la primera burbuja y permanece visible tras enviar una pregunta
    Given que el componente HrChat se renderiza con hrService mockeado (éxito)
    When el usuario envía una pregunta y la API responde
    Then el saludo "¡Hola! Soy el asistente de Mercurial. Puedo responder consultas sobre RR.HH., tecnología y finanzas a partir de la base de conocimiento cargada. ¿En qué te ayudo?" sigue presente como primera burbuja del hilo

  @s5
  Scenario: Cada burbuja de la conversación muestra la hora de creación en formato 24 horas es-AR
    Given que el reloj del cliente marca las 09:05 y el componente HrChat se renderiza con hrService mockeado (éxito)
    When el usuario envía una pregunta y la API responde
    Then la burbuja de la pregunta muestra la hora "09:05"
    And la burbuja de la respuesta muestra la hora "09:05"

  # ─── Error y reintento ───────────────────────────────────────────────────────

  @s6
  Scenario: Un error de la API muestra el bubble de error con Reintentar
    Given que el componente HrChat se renderiza con hrService mockeado (error)
    When el usuario envía una pregunta y la API falla
    Then se muestra un bubble con el texto "No se pudo obtener respuesta. Intentá de nuevo."
    And se muestra un botón con el texto "Reintentar"

  @s7
  Scenario: Reintentar reenvía la última pregunta que falló
    Given que el componente HrChat se renderiza con hrService mockeado (error en el primer intento, éxito en el segundo) y el usuario ya envió la pregunta "¿Cuántos días de vacaciones tengo?" y recibió un error
    When el usuario hace clic en "Reintentar"
    Then se llama a hrService.query con "¿Cuántos días de vacaciones tengo?"

  # ─── Panel «Fuentes de la respuesta» ────────────────────────────────────────

  @s8
  Scenario: El panel muestra una tarjeta por cada chunk del último intercambio, con la fuente tal cual llega
    Given que la última respuesta trajo tres chunks: uno con source "manual-rrhh.pdf", uno con source "api" y uno con source vacío
    When el chat termina de renderizar la respuesta
    Then el panel muestra una tarjeta con título "manual-rrhh.pdf"
    And el panel muestra una tarjeta con título "api"
    And el panel muestra una tarjeta con título "Base de conocimiento" para el chunk sin source

  @s9
  Scenario: El porcentaje de coincidencia se clampea a [0, 100]
    Given que la última respuesta trajo un chunk con similarity 1.2 y otro con similarity -0.3
    When el chat termina de renderizar la respuesta
    Then el panel muestra "100% de coincidencia" para el chunk con similarity 1.2
    And el panel muestra "0% de coincidencia" para el chunk con similarity -0.3

  @s10
  Scenario: Antes de la primera respuesta, el panel muestra su estado inicial
    Given que el componente HrChat se renderiza sin intercambios previos
    When el panel de contexto se renderiza
    Then se muestra el texto "Los fragmentos que respalden la respuesta aparecerán acá."

  @s11
  Scenario: Cuando la última respuesta no citó fragmentos, el panel muestra su estado sin fuentes
    Given que el componente HrChat se renderiza con hrService mockeado (éxito con chunks vacíos)
    When el usuario envía una pregunta y la API responde
    Then se muestra el texto "Esta respuesta no citó fragmentos de la base de conocimiento."

  @s12
  Scenario: Durante la carga de una nueva pregunta, el panel conserva las fuentes del intercambio anterior
    Given que el componente HrChat ya tiene un intercambio previo con chunks visibles en el panel
    When el usuario envía una nueva pregunta y la API todavía no responde
    Then el panel sigue mostrando las tarjetas de fuentes del intercambio anterior

  # ─── Panel «Consultas sugeridas» ─────────────────────────────────────────────

  @s13
  Scenario: Al hacer clic en una sugerencia, el texto se carga en el input y recibe foco sin enviarse
    Given que el componente HrChat se renderiza
    When el usuario hace clic en la sugerencia "Política de vacaciones"
    Then el textarea contiene el texto "¿Cómo funciona la política de vacaciones?"
    And el textarea tiene el foco activo
    And no se llama a hrService.query

  @s14
  Scenario: Al hacer clic en una sugerencia se registra el evento de analytics chat_suggestion_clicked
    Given que el componente HrChat se renderiza
    When el usuario hace clic en la sugerencia "Soporte técnico"
    Then se registra el evento "chat_suggestion_clicked" con el payload { suggestion: "¿Cómo pido soporte técnico o un equipo nuevo?" }

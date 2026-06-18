Feature: HR Chat — Consultas de Recursos Humanos
  Como empleado autenticado en Mercurial
  quiero hacer preguntas sobre políticas y beneficios de RR.HH.
  para obtener respuestas inmediatas sin intervención humana.

  @s1
  Scenario: Estado inicial muestra mensaje de bienvenida
    Given que el componente HrChat se renderiza sin mensajes previos
    When el historial está vacío
    Then se muestra el mensaje "¿En qué puedo ayudarte hoy?" en el área de mensajes

  @s2
  Scenario: El input recibe el foco automáticamente al cargar
    Given que el componente HrChat se renderiza
    When la carga inicial finaliza
    Then el elemento textarea tiene el foco activo

  @s3
  Scenario: Enviar una pregunta con Enter agrega el bubble del usuario al hilo
    Given que el componente HrChat se renderiza con hrService mockeado (éxito)
    When el usuario escribe "¿Cuántos días de vacaciones tengo?" en el textarea
    And presiona la tecla Enter
    Then aparece un bubble con el texto "¿Cuántos días de vacaciones tengo?" alineado a la derecha

  @s4
  Scenario: El input se limpia y deshabilita al enviar la pregunta
    Given que el componente HrChat se renderiza con hrService mockeado (éxito)
    When el usuario escribe una pregunta y presiona Enter
    Then el textarea queda vacío
    And el textarea está deshabilitado

  @s5
  Scenario: Aparece el indicador de pensando mientras la API responde
    Given que el componente HrChat se renderiza con hrService mockeado (pendiente)
    When el usuario envía una pregunta
    Then se muestra un elemento con el texto "Mercurial está procesando tu consulta"

  @s6
  Scenario: La respuesta de la API aparece como bubble a la izquierda
    Given que el componente HrChat se renderiza con hrService mockeado (éxito con respuesta "Tenés 15 días hábiles")
    When el usuario envía una pregunta y la API responde
    Then el indicador de pensando desaparece
    And aparece un bubble con el texto "Tenés 15 días hábiles" alineado a la izquierda

  @s7
  Scenario: El input se rehabilita y recupera el foco tras recibir la respuesta
    Given que el componente HrChat se renderiza con hrService mockeado (éxito)
    When el usuario envía una pregunta y la API responde
    Then el textarea está habilitado
    And el textarea tiene el foco activo

  @s8
  Scenario: Shift+Enter inserta un salto de línea en lugar de enviar
    Given que el componente HrChat se renderiza
    When el usuario escribe texto en el textarea y presiona Shift+Enter
    Then el textarea contiene un salto de línea
    And no se agrega ningún bubble al hilo

  @s9
  Scenario: No se envía la pregunta si el textarea está vacío
    Given que el componente HrChat se renderiza
    When el textarea está vacío y el usuario presiona Enter
    Then no se agrega ningún bubble al hilo
    And no se llama a hrService.query

  @s10
  Scenario: No se envía la pregunta si el textarea contiene solo espacios
    Given que el componente HrChat se renderiza
    When el usuario escribe "   " en el textarea y presiona Enter
    Then no se agrega ningún bubble al hilo
    And no se llama a hrService.query

  @s11
  Scenario: Error de API muestra bubble de error con botón Reintentar
    Given que el componente HrChat se renderiza con hrService mockeado (error)
    When el usuario envía una pregunta y la API falla
    Then el indicador de pensando desaparece
    And se muestra un bubble con el texto "No se pudo obtener respuesta. Intentá de nuevo."
    And se muestra un botón con el texto "Reintentar"

  @s12
  Scenario: El input vuelve a habilitarse tras un error de API
    Given que el componente HrChat se renderiza con hrService mockeado (error)
    When el usuario envía una pregunta y la API falla
    Then el textarea está habilitado

  @s13
  Scenario: El botón Reintentar reenvía la última pregunta
    Given que el componente HrChat se renderiza con hrService mockeado (error luego éxito)
    And el usuario ya envió la pregunta "¿Cuántos días de vacaciones tengo?" y recibió un error
    When el usuario hace clic en "Reintentar"
    Then se llama a hrService.query con "¿Cuántos días de vacaciones tengo?"

  @s14
  Scenario: El scroll se posiciona al último mensaje tras recibir la respuesta
    Given que el componente HrChat se renderiza con hrService mockeado (éxito)
    And ya existen varios mensajes en el hilo
    When el usuario envía una nueva pregunta y la API responde
    Then el área de mensajes hace scroll hasta el último elemento del hilo

  @s15
  Scenario: Usuario no puede enviar mientras la carga está en progreso
    Given que el componente HrChat se renderiza con hrService mockeado (pendiente)
    And el usuario ya envió una pregunta que aún no respondió
    When el usuario intenta presionar Enter en el textarea
    Then no se agrega un segundo bubble de pregunta al hilo
    And no se llama a hrService.query una segunda vez

  @s16
  Scenario: Respuesta muy larga no desborda el bubble
    Given que el componente HrChat se renderiza con hrService mockeado (éxito con respuesta de 1000 caracteres)
    When el usuario envía una pregunta y la API responde
    Then el bubble de respuesta no desborda visualmente su contenedor

  @s17
  Scenario: Pregunta larga (más de 500 caracteres) se envía correctamente
    Given que el componente HrChat se renderiza con hrService mockeado (éxito)
    When el usuario escribe una pregunta de 501 caracteres y presiona Enter
    Then aparece el bubble de la pregunta en el hilo
    And se llama a hrService.query con el texto completo de la pregunta

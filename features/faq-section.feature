Feature: Sección de preguntas frecuentes con footer global
  Como empleado quiero acceder a una página de preguntas frecuentes
  sobre el sistema Mercurial para entender qué puedo consultar y cómo funciona.

  @s1
  Scenario: El footer con enlace a /faq es visible en la página de chat (/)
    Given que el usuario abre la aplicación en la ruta "/"
    When la página se renderiza
    Then se muestra un elemento <footer> en la parte inferior del layout
    And el footer contiene un enlace con el texto "Preguntas frecuentes"
    And el enlace apunta a la ruta "/faq"

  @s2
  Scenario: El footer es visible en la página de carga RAG (/rag)
    Given que el usuario navega a la ruta "/rag"
    When la página se renderiza
    Then se muestra el footer con el enlace "Preguntas frecuentes" apuntando a "/faq"

  @s3
  Scenario: El footer es visible en la propia página /faq
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then se muestra el footer con el enlace "Preguntas frecuentes" apuntando a "/faq"
    And no se produce ningún error de ruta circular

  @s4
  Scenario: El enlace del footer navega a /faq sin recarga de página
    Given que el usuario está en la ruta "/"
    When el usuario hace clic en el enlace "Preguntas frecuentes" del footer
    Then la URL cambia a "/faq"
    And no se produce recarga completa de la página

  @s5
  Scenario: La ruta /faq renderiza la página de preguntas frecuentes
    Given que el usuario navega directamente a la ruta "/faq" por URL
    When la página se renderiza
    Then se muestra un título <h1> con el texto "Preguntas frecuentes"

  @s6
  Scenario: La página /faq usa el mismo header y footer que el resto de la app
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then se muestra el header de la aplicación con el branding "Mercurial"
    And se muestra el footer con el enlace "Preguntas frecuentes"

  @s7
  Scenario: La página /faq muestra un enlace para volver al chat
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then se muestra un enlace o botón con el texto "← Volver al chat"

  @s8
  Scenario: El enlace "← Volver al chat" navega a / sin recarga de página
    Given que el usuario está en la ruta "/faq"
    When el usuario hace clic en "← Volver al chat"
    Then la URL cambia a "/"
    And no se produce recarga completa de la página

  @s9
  Scenario: La página /faq muestra las seis preguntas frecuentes como encabezados <h2>
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then se muestra un <h2> con el texto "¿Qué tipo de consultas puedo hacer?"
    And se muestra un <h2> con el texto "¿Cómo funciona el sistema de búsqueda?"
    And se muestra un <h2> con el texto "¿Las respuestas son siempre correctas?"
    And se muestra un <h2> con el texto "¿Mis preguntas quedan guardadas?"
    And se muestra un <h2> con el texto "¿Quién carga el conocimiento que usa el sistema?"
    And se muestra un <h2> con el texto "¿Qué pasa si el sistema no sabe la respuesta?"

  @s10
  Scenario: Cada pregunta tiene su respuesta visible directamente sin interacción
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then la respuesta a "¿Qué tipo de consultas puedo hacer?" es visible en el DOM sin necesidad de clic
    And la respuesta a "¿Cómo funciona el sistema de búsqueda?" es visible en el DOM sin necesidad de clic
    And la respuesta a "¿Las respuestas son siempre correctas?" es visible en el DOM sin necesidad de clic
    And la respuesta a "¿Mis preguntas quedan guardadas?" es visible en el DOM sin necesidad de clic
    And la respuesta a "¿Quién carga el conocimiento que usa el sistema?" es visible en el DOM sin necesidad de clic
    And la respuesta a "¿Qué pasa si el sistema no sabe la respuesta?" es visible en el DOM sin necesidad de clic

  @s11
  Scenario: La respuesta de la pregunta 1 contiene el texto esperado
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then se muestra un <p> con el texto "Podés consultar sobre políticas de licencias, vacaciones, beneficios, procedimientos de incorporación, normativas internas y cualquier duda general de Recursos Humanos."

  @s12
  Scenario: La respuesta de la pregunta 2 menciona RAG y lenguaje natural
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then se muestra un <p> que contiene el texto "RAG (Retrieval-Augmented Generation)"
    And ese párrafo menciona que el sistema genera una respuesta en lenguaje natural

  @s13
  Scenario: La respuesta de la pregunta 4 indica que el historial no se guarda en servidor
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then se muestra un <p> que contiene el texto "No se almacena historial en ningún servidor."

  @s14
  Scenario: La página /faq no realiza ninguna llamada de red
    Given que el usuario navega a la ruta "/faq"
    When la página se renderiza
    Then no se llama a ningún servicio externo ni función de fetch

  @s15
  Scenario: El footer aplica los estilos visuales discretos definidos en el spec
    Given que el usuario abre la aplicación en cualquier ruta
    When el footer se renderiza
    Then el footer tiene fondo "--color-surface"
    And el footer tiene borde superior "1px solid var(--color-border)"
    And el texto del enlace usa el color "--color-text-muted" con tamaño "0.75rem"

  @s16
  Scenario: El enlace del footer tiene aria-current cuando el usuario ya está en /faq
    Given que el usuario está en la ruta "/faq"
    When el footer se renderiza
    Then el enlace "Preguntas frecuentes" tiene el atributo aria-current

  @s17
  Scenario: El layout de /faq no rompe en viewport menor a 320px
    Given que el usuario navega a la ruta "/faq" con un viewport de 300px de ancho
    When la página se renderiza
    Then el header, el contenido de FAQ y el footer permanecen visibles sin desbordamiento horizontal

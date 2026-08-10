Feature: Sidebar de navegación global con Tailwind y paleta Material Design 3
  Como usuario de Mercurial quiero un sidebar de navegación global y consistente
  en todas las rutas, con la nueva paleta de tokens MD3, para acceder a los
  destinos operativos de la app (y a sus futuras secciones) sin perder
  orientación ni depender de un footer.

  # ─── Estructura de navegación del sidebar ─────────────────────────────────

  @s1
  Scenario: El sidebar ofrece los cuatro destinos de navegación en el orden acordado
    Given que la aplicación está montada
    When el sidebar se renderiza
    Then se muestra, en este orden, un enlace "Chatbot IA" con destino "/"
    And un enlace "Analizador de Contratos" con destino "/contracts"
    And un enlace "Base de conocimiento" con destino "/rag"
    And un enlace "Configuración" con destino "/settings"

  @s2
  Scenario: Los destinos de las features futuras muestran un placeholder "Próximamente"
    Given que la aplicación está montada
    When el usuario navega a la ruta "/contracts" y a la ruta "/settings"
    Then ambas rutas muestran el texto "Próximamente"

  @s3
  Scenario: El item de navegación activo se resalta y el resto no
    Given que la aplicación está montada en la ruta "/rag"
    When el sidebar se renderiza
    Then el enlace "Base de conocimiento" tiene el atributo aria-current="page"
    And ninguno de los otros tres enlaces de navegación tiene aria-current

  # ─── Header superior ───────────────────────────────────────────────────────

  @s4
  Scenario: El botón "Ayuda" del header navega a /faq
    Given que la aplicación está montada en la ruta "/"
    When el usuario hace clic en el botón "Ayuda" del header
    Then la ruta activa cambia a "/faq"
    And no se produce una recarga completa de página

  # ─── Theme toggle reubicado ─────────────────────────────────────────────────

  @s5
  Scenario: El toggle de tema en el pie del sidebar cambia el tema y lo persiste
    Given que el tema actual es "dark"
    When el usuario activa el switch de tema en el pie del sidebar
    Then el atributo "data-theme" del elemento raíz del documento es "light"
    And localStorage contiene la clave de tema con el valor "light"

  # ─── Landing y elementos excluidos del alcance ─────────────────────────────

  @s6
  Scenario: La landing muestra el chat y no se renderiza el footer global ni los controles excluidos
    Given que la aplicación está montada en la ruta "/"
    When la página se renderiza
    Then se muestra el componente de chat de Recursos Humanos
    And no existe ningún elemento <footer> en el documento
    And el sidebar no contiene un enlace "Historial"
    And el header no contiene un botón de buscar ni un botón de notificaciones
    And el header no muestra un título de página

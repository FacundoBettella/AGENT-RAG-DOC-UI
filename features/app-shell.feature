Feature: App Shell — Estructura visual global
  Como empleado que accede a Mercurial
  quiero ver una estructura coherente con branding y área de chat
  para orientarme en la aplicación desde el primer instante.

  @s1
  Scenario: El header muestra el nombre de la aplicación
    Given que la aplicación se monta en el navegador
    When el componente AppShell se renderiza
    Then se muestra un elemento con el texto "Mercurial"

  @s2
  Scenario: El header muestra el subtítulo de la aplicación
    Given que la aplicación se monta en el navegador
    When el componente AppShell se renderiza
    Then se muestra un elemento con el texto "Consultas de Recursos Humanos"

  @s3
  Scenario: El layout ocupa la altura total del viewport
    Given que la aplicación se monta en el navegador
    When el componente AppShell se renderiza
    Then el contenedor raíz tiene un alto definido con "100dvh"

  @s4
  Scenario: El header está posicionado en la parte superior
    Given que la aplicación se monta en el navegador
    When el componente AppShell se renderiza
    Then existe un elemento <header> visible en el documento

  @s5
  Scenario: El área principal monta el componente de chat
    Given que la aplicación se monta en el navegador
    When el componente AppShell se renderiza
    Then existe un elemento <main> que contiene el componente HrChat

  @s6
  Scenario: Los tokens CSS globales están disponibles en el documento
    Given que la aplicación se monta en el navegador
    When el componente AppShell se renderiza
    Then el documento contiene la variable CSS "--color-bg"
    And el documento contiene la variable CSS "--color-gold"

  @s7
  Scenario: El layout no se rompe en viewport muy estrecho
    Given que el viewport tiene un ancho de 300px
    When el componente AppShell se renderiza
    Then el elemento <header> sigue siendo visible sin desbordamiento horizontal
    And el elemento <main> sigue siendo visible sin desbordamiento horizontal

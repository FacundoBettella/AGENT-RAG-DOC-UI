Feature: Header polish — título navegable e inline con subtítulo
  Como usuario de Mercurial quiero que el título del header sea un enlace
  a la página principal para poder volver al chat desde cualquier ruta,
  y que el subtítulo aparezca en línea continua con el título.

  @s1
  Scenario: El header muestra título y subtítulo en una sola línea inline
    Given que la aplicación está montada
    When el header se renderiza
    Then se muestra el texto "Mercurial" dentro del header
    And se muestra el texto "Consultas de RR.HH." dentro del mismo bloque inline
    And el separador "—" aparece entre "Mercurial" y "Consultas de RR.HH."

  @s2
  Scenario: El título es un enlace navegable a "/"
    Given que la aplicación está montada
    When el header se renderiza
    Then existe un enlace con atributo href igual a "/"
    And ese enlace contiene el texto "Mercurial"

  @s3
  Scenario: El enlace tiene aria-label accesible
    Given que la aplicación está montada
    When el header se renderiza
    Then el enlace del header tiene aria-label "Ir al chat"

  @s4
  Scenario: Clic en el enlace desde la ruta "/rag" navega a "/"
    Given que el usuario está en la ruta "/rag"
    When hace clic en el enlace del header
    Then la ruta activa cambia a "/"
    And no se produce una recarga completa de página

  @s5
  Scenario: Clic en el enlace desde la ruta "/faq" navega a "/"
    Given que el usuario está en la ruta "/faq"
    When hace clic en el enlace del header
    Then la ruta activa cambia a "/"
    And no se produce una recarga completa de página

  @s6
  Scenario: Clic en el enlace cuando ya se está en "/" no produce error
    Given que el usuario está en la ruta "/"
    When hace clic en el enlace del header
    Then la ruta activa sigue siendo "/"
    And no se muestra ningún mensaje de error

  @s7
  Scenario: El enlace no muestra subrayado ni decoración de hipervínculo
    Given que la aplicación está montada
    When el header se renderiza
    Then el enlace del header tiene la propiedad CSS "text-decoration" igual a "none"

  @s8
  Scenario: El caduceo (⚕) forma parte del enlace
    Given que la aplicación está montada
    When el header se renderiza
    Then el símbolo "⚕" está contenido dentro del mismo enlace que "Mercurial"

  @s9
  Scenario: El GearButton está fuera del enlace del header
    Given que la aplicación está montada
    When el header se renderiza
    Then el botón de configuración (⚙) existe en el header
    And ese botón no está contenido dentro del enlace a "/"

  @s10
  Scenario: En viewport de 320px el header se renderiza sin romper el layout
    Given que el viewport tiene un ancho de 320px
    When el header se renderiza
    Then el enlace del header sigue presente en el DOM
    And el header no desborda horizontalmente el viewport

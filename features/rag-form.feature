Feature: RAG Form — Carga de archivos para indexado
  Como usuario autenticado en Mercurial
  quiero cargar archivos de texto desde la pantalla /rag
  para que el sistema los chunkee e indexe y pueda consultarlos luego.

  @s1
  Scenario: La pantalla muestra el texto explicativo sobre chunking e indexado
    Given que la RagPage se renderiza
    When la vista carga
    Then se muestra un texto que explica que los archivos serán divididos en fragmentos e indexados para búsqueda

  @s2
  Scenario: El file picker acepta solo archivos .txt
    Given que la RagPage se renderiza
    When el usuario inspecciona el input de archivos
    Then el input tiene el atributo accept igual a ".txt"

  @s3
  Scenario: El botón de subir está deshabilitado si no hay archivos seleccionados
    Given que la RagPage se renderiza sin archivos seleccionados
    When la vista carga
    Then el botón con nombre accesible "Subir archivos" está deshabilitado

  @s4
  Scenario: Al seleccionar archivos el botón se habilita
    Given que la RagPage se renderiza
    When el usuario selecciona uno o más archivos .txt en el input
    Then el botón con nombre accesible "Subir archivos" está habilitado

  @s5
  Scenario: Al enviar aparece el indicador Loading
    Given que la RagPage se renderiza con ragService mockeado (pendiente)
    When el usuario selecciona archivos y presiona el botón "Subir archivos"
    Then el componente Loading es visible en la pantalla

  @s6
  Scenario: El botón y el input se deshabilitan mientras carga
    Given que la RagPage se renderiza con ragService mockeado (pendiente)
    When el usuario selecciona archivos y presiona el botón "Subir archivos"
    Then el botón con nombre accesible "Subir archivos" está deshabilitado
    And el input de archivos está deshabilitado

  @s7
  Scenario: Éxito — desaparece Loading y aparece mensaje de confirmación
    Given que la RagPage se renderiza con ragService mockeado (éxito)
    When el usuario selecciona archivos y presiona el botón "Subir archivos"
    Then el componente Loading no es visible
    And se muestra un mensaje de confirmación de que los archivos fueron indexados correctamente

  @s8
  Scenario: Error — desaparece Loading y aparece mensaje de error con botón Reintentar
    Given que la RagPage se renderiza con ragService mockeado (error)
    When el usuario selecciona archivos y presiona el botón "Subir archivos"
    Then el componente Loading no es visible
    And se muestra un mensaje de error
    And aparece un botón con nombre accesible "Reintentar"

  @s9
  Scenario: Reintentar reenvía los mismos archivos y vuelve al estado de loading
    Given que la RagPage se renderiza con ragService mockeado (error en primer intento, pendiente en reintento)
    When el usuario selecciona archivos, sube, recibe error y presiona "Reintentar"
    Then ragService es llamado nuevamente con los mismos archivos
    And el componente Loading es visible en la pantalla

  @s10
  Scenario: El componente Loading muestra puntos animados accesibles
    Given que el componente Loading se renderiza de forma aislada
    When el componente carga
    Then existe un elemento con role "status" o aria-label que comunica el estado de carga
    And se renderizan puntos animados visibles en la pantalla

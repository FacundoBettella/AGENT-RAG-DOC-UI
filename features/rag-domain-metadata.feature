Feature: Selección de dominio al cargar conocimiento a la base RAG
  Como empleado de Mercurial quiero elegir el dominio (RR.HH./Tecnología/Finanzas) antes de
  subir documentos en /rag para que la ingesta real funcione contra el RAG AGENT API, que exige
  domain en POST /api/ingest y hoy falla porque ragService no lo envía.

  # ─── Contrato de red: ragService.upload ─────────────────────────────────────

  @s1
  Scenario: ragService.upload arma el body { domain, documents }, pega a /api/ingest y traduce la respuesta a camelCase
    Given que el usuario seleccionó dos archivos .txt con contenidos "Política de licencias" y "Manual de accesos"
    And el backend responde HTTP 200 en POST /api/ingest con ingest_result.domain "hr", ingest_result.documents_received 2, ingest_result.chunks_indexed 40, sin total_in_store
    When se llama a ragService.upload con esos archivos y el dominio "tech"
    Then el request se envía a la URL que termina en "/api/ingest"
    And el body enviado es { domain: "tech", documents: ["Política de licencias", "Manual de accesos"] }
    And la promesa resuelve con { domain: "tech", documentsReceived: 2, chunksIndexed: 40, totalInStore: 0 }

  @s2
  Scenario: ragService.upload lanza un Error si el payload de respuesta no cumple el contrato mínimo
    Given que el backend responde HTTP 200 en POST /api/ingest con ingest_result.chunks_indexed o ingest_result.documents_received no numérico o negativo
    When se llama a ragService.upload con archivos válidos y un dominio
    Then la promesa es rechazada con un Error

  # ─── Selector de dominio en /rag ─────────────────────────────────────────────

  @s3
  Scenario: El selector de dominio se muestra como fieldset con tres opciones, ninguna preseleccionada
    Given que el usuario abre la página de carga RAG
    When el formulario se renderiza
    Then se muestra un fieldset con la leyenda "Dominio de la base de conocimiento"
    And se muestra el texto de ayuda "Todos los archivos de esta carga se indexan en el dominio elegido." asociado al fieldset
    And se muestran tres opciones de radio con las etiquetas "RR.HH.", "Tecnología" y "Finanzas"
    And ninguna de las tres opciones está seleccionada

  @s4
  Scenario: El botón "Subir archivos" permanece deshabilitado sin dominio elegido aunque haya archivos válidos, y se habilita al elegir uno
    Given que el formulario tiene archivos .txt válidos en la lista y el botón "Subir archivos" está deshabilitado por no haber dominio elegido
    When el usuario selecciona el dominio "Tecnología"
    Then el botón "Subir archivos" pasa a estar habilitado

  @s5
  Scenario: El selector de dominio se deshabilita durante la carga
    Given que el formulario tiene archivos válidos, un dominio elegido y el envío en progreso
    When el formulario se renderiza con status "loading"
    Then las tres opciones del selector de dominio están deshabilitadas

  # ─── Éxito: dominio persistente y mensaje con datos reales ─────────────────

  @s6
  Scenario: Tras un envío exitoso el dominio elegido se conserva y el mensaje de éxito usa los datos reales de la respuesta
    Given que el formulario tiene archivos válidos, el dominio "RR.HH." elegido, y ragService.upload mockeado para resolver con { domain: "hr", documentsReceived: 3, chunksIndexed: 57, totalInStore: 240 }
    When el usuario hace clic en "Subir archivos" y el envío se completa
    Then se muestra el mensaje "Se indexaron 57 fragmentos de 3 archivos en la base de RR.HH."
    And la opción de dominio "RR.HH." sigue marcada como seleccionada

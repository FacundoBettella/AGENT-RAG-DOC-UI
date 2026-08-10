Feature: Analizador de Contratos — comparación de contrato y enmienda vía DOC AGENT API
  Como empleado de Mercurial quiero subir un contrato original y su enmienda para que
  el sistema me diga qué cambió entre ambos, sin tener que compararlos manualmente
  cláusula por cláusula.

  # ─── Contrato de red: docAgentService.analyze ──────────────────────────────

  @s1
  Scenario: docAgentService.analyze arma el FormData correcto, pega a /analysis sin barra final y traduce el resultado a camelCase
    Given que el backend responde HTTP 200 en POST /analysis con sections_changed ["Cláusula 4.2 - Plazo"], topics_touched ["Monto"] y summary_of_the_change "El monto se actualizó de $100.000 a $150.000."
    When se llama a docAgentService.analyze con un archivo original y un archivo de enmienda
    Then el request se envía a la URL que termina en "/analysis" sin barra final
    And el body es un FormData con los campos "original_image" y "amendment_image", sin un header Content-Type seteado manualmente
    And la promesa resuelve con { sectionsChanged: ["Cláusula 4.2 - Plazo"], topicsTouched: ["Monto"], summary: "El monto se actualizó de $100.000 a $150.000." }

  @s2
  Scenario: docAgentService.analyze lanza un Error si el payload del backend no cumple el contrato mínimo
    Given que el backend responde HTTP 200 en POST /analysis con sections_changed vacío (arrays sin ningún string no vacío) o summary_of_the_change vacío
    When se llama a docAgentService.analyze con un archivo original y un archivo de enmienda
    Then la promesa es rechazada con un Error

  # ─── extractBackendError entiende el shape de DOC AGENT API ────────────────

  @s3
  Scenario: extractBackendError devuelve response.data.detail cuando es un string no vacío
    Given que el backend de DOC AGENT API responde con un error HTTP cuyo body es { detail: "La imagen no es un formato de archivo soportado." }
    When se llama a extractBackendError con esa respuesta
    Then devuelve el string "La imagen no es un formato de archivo soportado."

  @s4
  Scenario: El 422 de FastAPI con detail como array cae al mensaje genérico
    Given que el backend responde HTTP 422 con body { detail: [ { loc: [...], msg: "field required", type: "..." } ] }
    When se llama a extractBackendError con esa respuesta
    Then devuelve null

  # ─── Validaciones de archivo antes de enviar ────────────────────────────────

  @s5
  Scenario: Rechaza un archivo con extensión no soportada sin reemplazar el archivo válido ya cargado
    Given que la dropzone "Contrato original" ya tiene cargada la imagen válida "contrato.png"
    When el usuario selecciona el archivo "contrato.pdf" para esa dropzone
    Then se muestra el mensaje "Formato no soportado. Subí una imagen .png, .jpg o .jpeg." en la dropzone "Contrato original"
    And la dropzone sigue mostrando el archivo "contrato.png"
    And no se llama a docAgentService.analyze

  @s6
  Scenario: Rechaza una imagen que supera los 10 MB
    Given que el usuario abre la pantalla del Analizador de Contratos
    When el usuario selecciona un archivo "enmienda.jpg" de 11 MB para la dropzone "Enmienda"
    Then se muestra el mensaje "La imagen supera el límite de 10 MB." en la dropzone "Enmienda"
    And la dropzone "Enmienda" permanece vacía
    And no se llama a docAgentService.analyze

  @s7
  Scenario: El botón "Analizar documentos" permanece deshabilitado mientras falte alguno de los dos archivos
    Given que el usuario cargó una imagen válida en una sola de las dos dropzones
    When la pantalla se renderiza
    Then el botón "Analizar documentos" está deshabilitado
    And no se llama a docAgentService.analyze

  @s8
  Scenario: El error inline de una dropzone se limpia al aceptar un archivo válido
    Given que la dropzone "Enmienda" muestra el error "La imagen supera el límite de 10 MB." tras un intento anterior
    When el usuario selecciona la imagen válida "enmienda.png" de 2 MB para esa dropzone
    Then el mensaje de error ya no se muestra en la dropzone "Enmienda"
    And la dropzone muestra el archivo "enmienda.png"

  # ─── Panel de estado (región aria-live, 4 estados excluyentes) ─────────────

  @s9
  Scenario: Estado inicial (idle) — mensaje informativo con los dos pasos del proceso
    Given que el usuario abre la pantalla del Analizador de Contratos sin haber enviado ningún análisis
    When el panel de estado se renderiza
    Then el panel es una región con aria-live="polite"
    And se muestra el título "Inteligencia analítica"
    And se muestra el paso "01 Transcripción de las imágenes"
    And se muestra el paso "02 Detección de cambios"

  @s10
  Scenario: Estado de carga — spinner y texto fijo, sin barra de progreso
    Given que el usuario cargó ambos archivos válidos y docAgentService.analyze está mockeado sin resolver todavía
    When el usuario hace clic en "Analizar documentos"
    Then el panel de estado muestra un spinner y el texto "Analizando documentos…"
    And se muestra la nota "Puede tardar hasta un minuto: se transcriben las dos imágenes y después se comparan."
    And no se muestra ninguna barra de progreso
    And el botón muestra el label "Analizando…" y está deshabilitado

  @s11
  Scenario: Estado de error — mensaje del backend y botón "Reintentar"
    Given que el usuario cargó ambos archivos válidos y docAgentService.analyze está mockeado para fallar con el mensaje "No se pudieron analizar los documentos. Intentá de nuevo."
    When el usuario hace clic en "Analizar documentos"
    Then el panel de estado muestra el mensaje "No se pudieron analizar los documentos. Intentá de nuevo."
    And se muestra un botón "Reintentar"

  @s12
  Scenario: "Reintentar" reenvía el análisis con los mismos dos archivos
    Given que el panel de estado muestra un error tras un análisis fallido con los archivos "contrato.png" y "enmienda.png"
    When el usuario hace clic en "Reintentar"
    Then se llama a docAgentService.analyze con los archivos "contrato.png" y "enmienda.png"

  @s13
  Scenario: Estado de éxito — el resumen se muestra antes que las listas, los archivos persisten y se registra el analytics
    Given que el usuario cargó una imagen original de 1500000 bytes y una imagen de enmienda de 2000000 bytes, y docAgentService.analyze está mockeado para resolver con sectionsChanged ["Cláusula 4.2 - Plazo"], topicsTouched ["Monto"] y summary "El monto se actualizó."
    When el usuario hace clic en "Analizar documentos" y el análisis se completa
    Then el resumen "El monto se actualizó." aparece antes que la lista de secciones modificadas y que los chips de temas afectados
    And la dropzone "Contrato original" sigue mostrando su archivo
    And la dropzone "Enmienda" sigue mostrando su archivo
    And se registra el evento "contract_analysis_submitted" con el payload { originalSizeBytes: 1500000, amendmentSizeBytes: 2000000 }

  # ─── Persistencia y re-análisis tras un resultado exitoso ──────────────────

  @s14
  Scenario: Reemplazar uno de los dos archivos tras un resultado exitoso no borra el resultado visible
    Given que el panel de estado muestra el resultado de un análisis exitoso
    When el usuario selecciona una nueva imagen válida para la dropzone "Enmienda"
    Then el resultado del análisis anterior sigue visible en el panel

  @s15
  Scenario: Enviar un nuevo análisis descarta el resultado o error anterior
    Given que el panel de estado muestra el resultado de un análisis exitoso y el usuario reemplazó uno de los dos archivos
    When el usuario hace clic en "Analizar documentos" de nuevo
    Then el panel de estado pasa al estado de carga y el resultado anterior deja de mostrarse

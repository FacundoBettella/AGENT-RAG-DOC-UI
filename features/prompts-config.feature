Feature: Configuración — editor de los system prompts de los agentes (DOC AGENT API)
  Como empleado de Mercurial con acceso a /settings quiero ver y editar los system prompts
  de los agentes que analizan contratos, con una confirmación explícita antes de sobrescribir,
  para ajustar su comportamiento sin arriesgar un guardado accidental que el servidor no puede
  deshacer.

  # ─── Carga inicial y estados de loadStatus ──────────────────────────────────

  @s1
  Scenario: Carga inicial — una card por cada agente que devuelve el backend, en el orden recibido, sin asumir los dos nombres conocidos
    Given que GET /prompts responde con los agentes "extraction_agent", "contextualization_agent" y "review_agent", en ese orden
    When la pantalla de Configuración termina de cargar
    Then se muestran tres cards en ese mismo orden: "extraction_agent" primero, "contextualization_agent" segunda y "review_agent" tercera
    And la card de "extraction_agent" muestra el label "Agente de extracción"
    And la card de "review_agent" muestra el label "Review agent", derivado del agent_name, por no tener label ni descripción conocidos

  @s2
  Scenario: Error al cargar los prompts — bloque de error con mensaje y botón "Reintentar"
    Given que GET /prompts responde con un error de red
    When la pantalla de Configuración termina de cargar
    Then se muestra el mensaje "No se pudieron cargar los prompts. Intentá de nuevo." en un bloque de error
    And se muestra un botón "Reintentar"
    And no se muestra ninguna card de agente

  # ─── Edición del borrador y validación ───────────────────────────────────────

  @s3
  Scenario: Editar el textarea marca la card como "Sin guardar" y habilita "Guardar cambios"
    Given que la card del "Agente de extracción" muestra el prompt guardado "Sos un Auditor de cambios contractuales."
    When el usuario edita el texto del textarea de esa card
    Then aparece el badge "Sin guardar" en el encabezado de la card
    And el botón "Guardar cambios" de esa card queda habilitado
    And aparece el botón "Descartar cambios"

  @s4
  Scenario: "Descartar cambios" revierte el textarea al último valor guardado
    Given que la card del "Agente de extracción" tiene un borrador editado y sin guardar, distinto del prompt guardado "Sos un Auditor de cambios contractuales."
    When el usuario hace clic en "Descartar cambios"
    Then el textarea vuelve a mostrar "Sos un Auditor de cambios contractuales."
    And el badge "Sin guardar" ya no se muestra
    And el botón "Descartar cambios" deja de mostrarse

  @s5
  Scenario: Un borrador vacío o con solo espacios deja "Guardar cambios" deshabilitado
    Given que la card del "Agente de extracción" tiene un prompt guardado no vacío
    When el usuario borra el texto del textarea y deja solo espacios en blanco
    Then el botón "Guardar cambios" de esa card está deshabilitado
    And la región de estado de la card muestra el mensaje "El prompt no puede quedar vacío."

  # ─── Flujo de guardado en dos pasos: modal de confirmación ──────────────────

  @s6
  Scenario: "Guardar cambios" abre el modal de confirmación sin disparar el PUT, como instancia única compartida entre las cards
    Given que la card del "Agente de extracción" tiene un borrador dirty y la card del "Agente de contextualización" también tiene un borrador dirty distinto
    When el usuario hace clic en "Guardar cambios" de la card del "Agente de extracción"
    Then se muestra un único modal con role="dialog" y el texto "Vas a reemplazar el system prompt de Agente de extracción."
    And no se llama a promptsService.update
    And el foco inicial del modal está en el botón "Cancelar"
    And el textarea de la card del "Agente de contextualización" sigue mostrando su borrador dirty intacto, sin un segundo modal asociado a ella

  @s7
  Scenario: Cerrar el modal sin confirmar no dispara el PUT ni altera el borrador, y devuelve el foco a quien lo abrió
    Given que el modal de confirmación está abierto para la card del "Agente de extracción", con un borrador dirty
    When el usuario cierra el modal sin confirmar, con el botón "Cancelar", con la tecla Escape o con un clic en el backdrop
    Then no se llama a promptsService.update
    And el modal deja de estar en el DOM
    And el textarea de la card del "Agente de extracción" sigue mostrando el mismo borrador dirty que tenía antes de abrir el modal
    And el foco vuelve al botón "Guardar cambios" que abrió el modal

  @s8
  Scenario: Confirmar ("Sobrescribir") cierra el modal, registra el analytics antes del request y actualiza el baseline con la respuesta del backend
    Given que el modal de confirmación está abierto para la card del "Agente de extracción" con el borrador "Nuevo texto." y promptsService.update mockeado para responder con agentName "extraction_agent" y systemPrompt "Nuevo texto."
    When el usuario hace clic en "Sobrescribir"
    Then se registra el evento "prompt_saved" con el payload { agentName: "extraction_agent", promptLength: 12 } antes de que se resuelva la llamada a promptsService.update
    And el modal deja de estar en el DOM inmediatamente, sin esperar la respuesta del PUT
    And se llama a promptsService.update con "extraction_agent" y "Nuevo texto."
    And al resolver la llamada, la card ya no muestra el badge "Sin guardar" y muestra el mensaje "Cambios guardados."

  # ─── Error de guardado y reintento ───────────────────────────────────────────

  @s9
  Scenario: Error al guardar — feedback inline con aria-live después de cerrar el modal, borrador intacto
    Given que el modal de confirmación está abierto para la card del "Agente de extracción" y promptsService.update mockeado para fallar con el mensaje "No se pudo guardar el prompt. Intentá de nuevo."
    When el usuario hace clic en "Sobrescribir"
    Then el modal deja de estar en el DOM
    And la región de estado de la card, con aria-live="polite", muestra el mensaje "No se pudo guardar el prompt. Intentá de nuevo." en un bloque de error
    And el textarea de la card conserva el mismo borrador sin cambios
    And la card sigue mostrando el badge "Sin guardar"

  @s10
  Scenario: Reintentar tras un error reusa "Guardar cambios" y vuelve a pasar por el modal, sin bypassear la confirmación
    Given que la card del "Agente de extracción" muestra el error de guardado de un intento anterior, con el borrador aún dirty
    When el usuario hace clic en "Guardar cambios"
    Then se abre el modal de confirmación para "extraction_agent"
    And no se llama a promptsService.update hasta que el usuario confirme desde el modal

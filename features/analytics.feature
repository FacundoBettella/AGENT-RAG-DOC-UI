Feature: Analytics — registro de interacciones clave del usuario
  Como sistema de tracking quiero registrar acciones del usuario
  para obtener datos de uso sin exponer información privada ni interrumpir el flujo principal.

  Background:
    Given que VITE_GA_ID no está configurado (entorno de desarrollo)
    And analyticsService usa console.info como destino de fallback

  @s1
  Scenario: chat_message_sent se registra al enviar una pregunta
    Given que el hook useHrChat tiene analyticsService espiado
    When el usuario envía una pregunta de longitud 42 caracteres
    Then console.info es llamado con "[analytics] chat_message_sent {\"question_length\":42}"

  @s2
  Scenario: chat_message_sent no incluye el texto de la pregunta en el payload
    Given que el hook useHrChat tiene analyticsService espiado
    When el usuario envía una pregunta con texto "¿Cuántos días de vacaciones tengo?"
    Then console.info es llamado con un string que contiene "question_length"
    And console.info NO es llamado con ningún string que contenga el texto de la pregunta

  @s3
  Scenario: chat_retry_clicked se registra al hacer click en Reintentar
    Given que el hook useHrChat se encuentra en estado de error tras un fallo de API
    And la última pregunta enviada tenía longitud 20 caracteres
    When el usuario hace click en "Reintentar"
    Then console.info es llamado con "[analytics] chat_retry_clicked {\"question_length\":20}"

  @s4
  Scenario: rag_files_selected se registra al seleccionar archivos
    Given que el hook useRagUpload tiene analyticsService espiado
    When el usuario selecciona 3 archivos con un tamaño total de 2048 bytes
    Then console.info es llamado con "[analytics] rag_files_selected {\"file_count\":3,\"total_size_bytes\":2048}"

  @s5
  Scenario: rag_form_submitted se registra al completar la ingesta RAG exitosamente
    Given que el hook useRagUpload tiene analyticsService espiado y ragService mockeado para éxito
    When el formulario RAG se envía con 2 archivos de 1024 bytes en total
    Then console.info es llamado con "[analytics] rag_form_submitted {\"file_count\":2,\"total_size_bytes\":1024}"

  @s6
  Scenario: trackEvent sin payload emite solo el nombre del evento
    Given que analyticsService está disponible con console.info espiado
    When se llama a trackEvent con nombre "chat_message_sent" sin pasar payload
    Then console.info es llamado con "[analytics] chat_message_sent"
    And console.info NO es llamado con un string que contenga "undefined" ni "{}"

  @s7
  Scenario: trackEvent con payload vacío emite el nombre y objeto vacío
    Given que analyticsService está disponible con console.info espiado
    When se llama a trackEvent con nombre "chat_message_sent" y payload {}
    Then console.info es llamado con "[analytics] chat_message_sent {}"

  @s8
  Scenario: trackEvent no propaga excepciones al llamador cuando falla internamente
    Given que analyticsService tiene console.info reemplazado por una función que lanza Error
    When se llama a trackEvent con nombre "chat_message_sent" y payload { question_length: 10 }
    Then la llamada retorna sin lanzar ninguna excepción
    And el flujo del llamador continúa normalmente

  @s9
  Scenario: trackEvent descarta silenciosamente un payload con referencias circulares
    Given que analyticsService está disponible con console.info espiado
    When se llama a trackEvent con un payload que contiene una referencia circular
    Then console.info NO es llamado (el evento se descarta sin error)
    And la llamada retorna sin lanzar ninguna excepción

  @s10
  Scenario: chat_message_sent se dispara antes del fetch, no después
    Given que el hook useHrChat tiene analyticsService espiado y hrService mockeado
    When el usuario envía una pregunta
    Then console.info es llamado con el evento "chat_message_sent" antes de que hrService.query sea invocado

  @s11
  Scenario: un error de API tras el envío no duplica ni elimina el evento chat_message_sent
    Given que el hook useHrChat tiene analyticsService espiado y hrService mockeado para error
    When el usuario envía una pregunta
    Then console.info es llamado exactamente una vez con un string que contiene "chat_message_sent"

  @s12
  Scenario: cuando VITE_GA_ID está configurado, trackEvent llama ReactGA.event en lugar de console.info
    Given que VITE_GA_ID tiene el valor "G-TEST12345"
    And ReactGA.event está espiado
    When se llama a trackEvent con nombre "chat_message_sent" y payload { question_length: 5 }
    Then ReactGA.event es llamado con ("chat_message_sent", { question_length: 5 })
    And console.info NO es llamado

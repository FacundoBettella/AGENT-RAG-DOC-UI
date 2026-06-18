Feature: Integración con endpoints reales
  Como desarrollador del sistema Mercurial
  quiero reemplazar los stubs de hrService y ragService con fetch real a los endpoints del backend
  para que las consultas de RR.HH. y la carga de documentos operen sobre datos reales.

  # ──────────────────────────────────────────────
  # hrService — POST /api/query
  # ──────────────────────────────────────────────

  @s1
  Scenario: hrService.query envía POST /api/query con el campo question
    Given que VITE_API_BASE_URL está configurado en el entorno
    When se llama a hrService.query con la pregunta "¿Cuántos días de vacaciones tengo?"
    Then axios realiza un POST a "{VITE_API_BASE_URL}/api/query"
    And el body enviado contiene exactamente { "question": "¿Cuántos días de vacaciones tengo?" }

  @s2
  Scenario: hrService.query retorna el texto del campo result en la respuesta exitosa
    Given que el backend responde HTTP 200 con { "result": "Tenés 21 días de vacaciones." }
    When se llama a hrService.query con cualquier pregunta
    Then la promesa resuelve con el string "Tenés 21 días de vacaciones."

  @s3
  Scenario: hrService.query lanza Error con el mensaje del backend ante respuesta 4xx
    Given que el backend responde HTTP 400 con { "error": "Pregunta inválida." }
    When se llama a hrService.query con cualquier pregunta
    Then la promesa es rechazada con un Error cuyo mensaje es "Pregunta inválida."

  @s4
  Scenario: hrService.query lanza Error con el mensaje del backend ante respuesta 5xx
    Given que el backend responde HTTP 500 con { "error": "Error interno del servidor." }
    When se llama a hrService.query con cualquier pregunta
    Then la promesa es rechazada con un Error cuyo mensaje es "Error interno del servidor."

  @s5
  Scenario: hrService.query relanza como Error tipado, no como objeto crudo de axios
    Given que el backend responde con cualquier error HTTP
    When se llama a hrService.query y el backend devuelve error
    Then el rechazo es una instancia de Error (no un AxiosError expuesto a la capa de UI)

  @s6
  Scenario: hrService.query lee VITE_API_BASE_URL para construir la URL base
    Given que VITE_API_BASE_URL está definido como "http://api.mercurial.local"
    When se llama a hrService.query
    Then la URL del request es "http://api.mercurial.local/api/query"

  # ──────────────────────────────────────────────
  # ragService — POST /api/ingest
  # ──────────────────────────────────────────────

  @s7
  Scenario: ragService.upload envía POST /api/ingest con el array documents
    Given que VITE_API_BASE_URL está configurado en el entorno
    And el usuario seleccionó dos archivos .txt con contenidos "Texto A" y "Texto B"
    When se llama a ragService.upload con esos archivos
    Then axios realiza un POST a "{VITE_API_BASE_URL}/api/ingest"
    And el body enviado contiene { "documents": ["Texto A", "Texto B"] }

  @s8
  Scenario: ragService.upload construye el array de strings leyendo cada archivo con FileReader
    Given que el usuario seleccionó un archivo .txt cuyo contenido es "Política de licencias\n..."
    When se llama a ragService.upload con ese archivo
    Then el array documents enviado contiene el texto plano del archivo como primer elemento

  @s9
  Scenario: ragService.upload resuelve sin valor ante respuesta HTTP 200 exitosa
    Given que el backend responde HTTP 200 con { "message": "Documentos indexados." }
    When se llama a ragService.upload con archivos válidos
    Then la promesa resuelve (void) sin lanzar ningún error

  @s10
  Scenario: ragService.upload resuelve sin valor ante respuesta HTTP 204 sin body
    Given que el backend responde HTTP 204 sin body
    When se llama a ragService.upload con archivos válidos
    Then la promesa resuelve (void) sin lanzar ningún error

  @s11
  Scenario: ragService.upload lanza Error con el mensaje del backend ante respuesta 4xx
    Given que el backend responde HTTP 422 con { "error": "Formato de documento inválido." }
    When se llama a ragService.upload con archivos válidos
    Then la promesa es rechazada con un Error cuyo mensaje es "Formato de documento inválido."

  @s12
  Scenario: ragService.upload lanza Error con el mensaje del backend ante respuesta 5xx
    Given que el backend responde HTTP 503 con { "error": "Servicio temporalmente no disponible." }
    When se llama a ragService.upload con archivos válidos
    Then la promesa es rechazada con un Error cuyo mensaje es "Servicio temporalmente no disponible."

  @s13
  Scenario: ragService.upload relanza como Error tipado, no como objeto crudo de axios
    Given que el backend responde con cualquier error HTTP
    When se llama a ragService.upload
    Then el rechazo es una instancia de Error (no un AxiosError expuesto a la capa de UI)

  @s14
  Scenario: ragService.upload lanza Error sin llamar a la API si el array de documentos está vacío
    Given que el usuario no seleccionó ningún archivo (lista vacía)
    When se llama a ragService.upload con una lista vacía
    Then la promesa es rechazada con un Error antes de realizar ningún request HTTP

  @s15
  Scenario: ragService.upload lee VITE_API_BASE_URL para construir la URL base
    Given que VITE_API_BASE_URL está definido como "http://api.mercurial.local"
    When se llama a ragService.upload con archivos válidos
    Then la URL del request es "http://api.mercurial.local/api/ingest"

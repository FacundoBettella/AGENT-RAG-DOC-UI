Feature: Fallback correcto del RAG AGENT API base URL
  Como sistema quiero que getRagBaseUrl() y los services que lo consumen
  usen el puerto correcto del RAG AGENT API (8080) cuando la variable de
  entorno VITE_RAG_API_BASE_URL no está definida, para que hrService y
  ragService no fallen contra el puerto equivocado (8000, del DOC AGENT API).

  @s1
  Scenario: getRagBaseUrl usa el valor de la variable de entorno cuando está definida
    Given que VITE_RAG_API_BASE_URL está definida con un valor
    When se llama a getRagBaseUrl()
    Then el valor devuelto es el de VITE_RAG_API_BASE_URL

  @s2
  Scenario: getRagBaseUrl usa http://localhost:8080 como fallback cuando la variable no está definida
    Given que VITE_RAG_API_BASE_URL no está definida
    When se llama a getRagBaseUrl()
    Then el valor devuelto es "http://localhost:8080"

  @s3
  Scenario: hrService.query pega contra el puerto correcto sin la variable de entorno
    Given que VITE_RAG_API_BASE_URL no está definida
    When se llama a hrService.query con una pregunta
    Then se realiza un POST a "http://localhost:8080/api/query"

  @s4
  Scenario: ragService.upload pega contra el puerto correcto sin la variable de entorno
    Given que VITE_RAG_API_BASE_URL no está definida
    When se llama a ragService.upload con archivos y un dominio
    Then se realiza un POST a "http://localhost:8080/api/ingest"

Feature: El test de armado de URL del DOC AGENT API no depende del valor ambiente de la env var
  Como equipo de mantenimiento quiero que promptsService.list() se verifique comprobando que
  delega la construcción de la URL en getDocAgentBaseUrl(), en vez de comparar contra un literal
  de host/puerto, para que la suite no falle "por casualidad" según el entorno donde corra
  (host local, Docker) ni deje sin cubrir el camino real que dice probar.

  @s1
  Scenario: promptsService.list invoca getDocAgentBaseUrl y arma la URL con el valor que devolvió
    Given que getDocAgentBaseUrl está espiada conservando su implementación real, sea cual sea el valor de VITE_DOC_AGENT_API_BASE_URL en el entorno (no definida, "http://localhost:8000", "http://host.docker.internal:8000" o cualquier otro)
    When se llama a promptsService.list()
    Then getDocAgentBaseUrl fue invocada exactamente una vez
    And la URL del request GET es el valor que devolvió getDocAgentBaseUrl seguido de "/prompts"

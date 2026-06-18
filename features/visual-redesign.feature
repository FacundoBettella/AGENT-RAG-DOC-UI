Feature: Visual Redesign — Tema, Navegación y Header Moderno
  Como usuario de Mercurial
  quiero un header modernizado con toggle de tema, menú de engranaje y navegación
  para tener una experiencia visual coherente y personalizable.

  # ─── Dropdown del engranaje ───────────────────────────────────────────────

  @s1
  Scenario: El ícono de engranaje abre el menú desplegable
    Given que la aplicación está montada
    When el usuario hace clic en el ícono de engranaje del header
    Then el menú desplegable es visible en el documento

  @s2
  Scenario: El ícono de engranaje cierra el menú desplegable cuando ya estaba abierto
    Given que la aplicación está montada
    And el menú desplegable está abierto
    When el usuario hace clic en el ícono de engranaje del header
    Then el menú desplegable ya no es visible en el documento

  @s3
  Scenario: El menú desplegable contiene una opción de cambio de tema
    Given que la aplicación está montada
    When el usuario abre el menú desplegable
    Then el menú contiene un control con rol "switch" o un botón con texto relacionado al tema

  @s4
  Scenario: El menú desplegable contiene un enlace a la pantalla RAG
    Given que la aplicación está montada
    When el usuario abre el menú desplegable
    Then el menú contiene un enlace con destino "/rag"

  # ─── Cambio de tema ───────────────────────────────────────────────────────

  @s5
  Scenario: Activar el tema claro aplica data-theme="light" en el documento
    Given que el tema actual es "dark"
    When el usuario activa el tema "light" desde el menú de configuración
    Then el atributo "data-theme" del elemento raíz del documento es "light"

  @s6
  Scenario: Activar el tema oscuro aplica data-theme="dark" en el documento
    Given que el tema actual es "light"
    When el usuario activa el tema "dark" desde el menú de configuración
    Then el atributo "data-theme" del elemento raíz del documento es "dark"

  # ─── Persistencia en localStorage ────────────────────────────────────────

  @s7
  Scenario: Cambiar el tema persiste el valor en localStorage
    Given que la aplicación está montada con localStorage vacío
    When el usuario activa el tema "light" desde el menú de configuración
    Then localStorage contiene la clave de tema con el valor "light"

  @s8
  Scenario: El tema se restaura desde localStorage al inicializar
    Given que localStorage contiene la clave de tema con el valor "light"
    When la aplicación se monta por primera vez
    Then el atributo "data-theme" del elemento raíz del documento es "light"

  @s9
  Scenario: El valor por defecto del tema es "dark" cuando localStorage está vacío
    Given que localStorage no contiene ningún valor de tema
    When la aplicación se monta por primera vez
    Then el atributo "data-theme" del elemento raíz del documento es "dark"

  # ─── Caduceo en el header ─────────────────────────────────────────────────

  @s10
  Scenario: El símbolo del caduceo es visible en el header
    Given que la aplicación está montada
    When el header se renderiza
    Then existe un elemento visible en el header que representa el caduceo de Hermes

  # ─── Navegación con React Router ──────────────────────────────────────────

  @s11
  Scenario: La ruta "/" renderiza la pantalla de chat
    Given que la aplicación está montada en la ruta "/"
    When el contenido principal se renderiza
    Then se muestra el componente de chat de Recursos Humanos

  @s12
  Scenario: La ruta "/rag" renderiza la pantalla RAG
    Given que la aplicación está montada en la ruta "/rag"
    When el contenido principal se renderiza
    Then se muestra la pantalla RAG

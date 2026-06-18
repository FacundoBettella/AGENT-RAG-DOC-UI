Feature: Pantalla de login
  Como usuario anonimo quiero autenticarme con email y contrasena
  para acceder a la aplicacion.

  @s1
  Scenario: Render inicial del formulario
    Given que el usuario abre la pantalla de login
    When el formulario se renderiza
    Then se muestra el campo "Email"
    And se muestra el campo "Contrasena"
    And se muestra el boton "Entrar"

  @s2
  Scenario: Boton deshabilitado sin datos
    Given que la pantalla de login esta visible
    When los campos email y contrasena estan vacios
    Then el boton "Entrar" esta deshabilitado

  @s3
  Scenario: Login exitoso
    Given que el servicio de autenticacion responde OK
    When el usuario completa email y contrasena validos
    And hace click en "Entrar"
    Then se llama al servicio de autenticacion con esas credenciales
    And se notifica exito al contenedor padre

  @s4
  Scenario: Credenciales invalidas
    Given que el servicio de autenticacion responde error de credenciales
    When el usuario completa email y contrasena y envia el formulario
    Then se muestra el mensaje "Credenciales invalidas"
    And el boton "Entrar" vuelve a habilitarse

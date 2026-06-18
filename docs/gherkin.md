# Gherkin — el contrato ejecutable

> "Once the project-spec.md is done, I have it create a set of .feature
> files from the project-spec.md." Los `.feature` son lo que el humano
> aprueba en la puerta, y el mapa que el `developer` recorre.

Los archivos viven en `features/<name>.feature`, donde `<name>` coincide
con el campo `name` de `feature_list.json`.

## Estructura

```gherkin
Feature: <propósito en una frase>
  Como <rol> quiero <capacidad> para <beneficio>.   # contexto opcional

  @s1
  Scenario: <comportamiento observable>
    Given <estado de partida (datos/mocks/contexto)>
    When <acción concreta del usuario>
    Then <resultado medible en la UI o en el sistema>

  @s2
  Scenario: <caso límite o error>
    Given ...
    When ...
    Then ...
```

## Reglas duras

- **Un `Scenario` por comportamiento observable**, incluidos los caminos de
  error (credenciales inválidas, campo vacío, error de red). Si el
  `project-spec.md` menciona un caso límite, tiene su escenario.
- **Tags estables** `@s1`, `@s2`, … Son el identificador que el
  `developer` (mapa `@s → test`) y el `reviewer` (cobertura) citan.
- **Cada `Then` afirma algo medible.** Prohibido "el sistema funciona". Se
  vale: `Then el botón "Entrar" está deshabilitado`, `Then se muestra el
  mensaje "Email inválido"`, `Then se llama al service con email y contraseña`.
- **Un solo `When` por escenario** (la acción bajo prueba). Si necesitas
  dos acciones, probablemente son dos escenarios.
- **Sin detalles de implementación.** El `.feature` describe
  comportamiento, no nombres de funciones, hooks o componentes internos.

## Qué es "medible" en un frontend React

| Afirmación válida                              | Nivel               |
|-------------------------------------------------|---------------------|
| El elemento X aparece en el DOM                 | DOM (RTL)           |
| El elemento X tiene el texto Y                  | DOM (RTL)           |
| El botón X está deshabilitado                   | DOM (RTL)           |
| Se muestra el rol `alert` con el mensaje Y      | Accesibilidad (RTL) |
| Se llama al service con los parámetros Z        | Mock assertion      |
| Se navega a la ruta `/dashboard`                | Router mock         |
| El hook expone `isLoading = true` mientras carga| `renderHook` (RTL)  |

## Ejemplo (feature `auth-login-screen`)

```gherkin
Feature: Pantalla de login
  Como usuario anónimo quiero autenticarme con email y contraseña
  para acceder a la aplicación.

  @s1
  Scenario: El formulario muestra los campos requeridos
    Given que el usuario abre la página de login
    When el componente LoginForm se renderiza
    Then se muestra un campo con label "Email"
    And se muestra un campo con label "Contraseña"
    And se muestra un botón con texto "Entrar"

  @s2
  Scenario: El botón está deshabilitado cuando los campos están vacíos
    Given que el LoginForm se renderiza
    When ningún campo tiene valor
    Then el botón "Entrar" está deshabilitado

  @s3
  Scenario: Credenciales correctas → llama al service y notifica al padre
    Given que el LoginForm se renderiza con authService mockeado (login éxito)
    When el usuario escribe un email válido y una contraseña
    And hace clic en "Entrar"
    Then se llama a authService.login con el email y la contraseña
    And se invoca la callback onSuccess

  @s4
  Scenario: Credenciales incorrectas → muestra mensaje de error
    Given que el LoginForm se renderiza con authService mockeado (login error)
    When el usuario rellena los campos y hace clic en "Entrar"
    Then se muestra el mensaje "Credenciales inválidas"
    And el botón "Entrar" vuelve a estar habilitado
```

## De Gherkin a test

No usamos un runner BDD (`Cucumber`, `playwright/bdd`) para no añadir
dependencias extra al proyecto. En su lugar, cada `Scenario` se traduce
**a mano** a un test de `@testing-library/react` cuyo nombre cita el
escenario:

```
@s1 → it("muestra los campos email, contraseña y botón")
@s2 → it("botón deshabilitado cuando los campos están vacíos")
@s3 → it("llama a authService.login y ejecuta onSuccess")
@s4 → it("muestra error de credenciales inválidas")
```

El `developer` escribe estos tests uno a uno (Rojo→Verde→Refactor) y
deja el mapa en `progress/tdd_<name>.md`. Así el `.feature` sigue siendo la
fuente de verdad legible por el humano, sin pagar el coste de un framework.

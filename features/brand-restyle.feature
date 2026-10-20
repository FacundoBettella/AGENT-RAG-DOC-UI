Feature: Identidad visual corporativa sobria (amarillo de acento sobre grises carbón, una sola sans, esquinas rectas)
  Como usuario de la app quiero una estética coherente en light y dark
  para leer y operar con claridad, sin cambios de copy ni de comportamiento.

  @s1
  Scenario: La paleta define los tokens acordados y las acciones principales usan el acento
    Given el archivo de estilos global con el tema light por defecto y el tema dark bajo [data-theme='dark']
    When se resuelven los tokens de color de cada tema
    Then define exactamente los tokens de la tabla del spec con sus valores light y dark
    And no define on-primary, secondary, tertiary ni tertiary-container
    And no queda ningún bg-primary ni text-on-primary en src/, salvo los puntos de Loading (Decisión 14)
    And el item activo del sidebar, los botones de acción principales y el avatar del asistente usan bg-accent con text-on-accent

  @s2
  Scenario: Todos los pares texto/fondo cumplen contraste WCAG AA en ambos temas
    Given los tokens resueltos de light y de dark desde el archivo de estilos global
    When se calcula el ratio de contraste de cada par texto/fondo listado en el spec
    Then cada par tiene un ratio mayor o igual a 4.5:1 en light
    And cada par tiene un ratio mayor o igual a 4.5:1 en dark

  @s3
  Scenario: La tipografía es una sola familia sans self-hosted
    Given la configuración de tema y el punto de entrada de la app
    When se inspeccionan las fuentes declaradas
    Then font-sans y font-display valen 'Overpass', ui-sans-serif, system-ui, sans-serif
    And se importan los pesos 400, 500, 600 y 700 de @fontsource/overpass
    And no existe --font-serif ni ningún uso de font-serif en src/
    And package.json no declara @fontsource/inter ni @fontsource/source-serif-4
    And el body usa la fuente font-sans

  @s4
  Scenario: Las esquinas son rectas salvo los elementos circulares
    Given la configuración de tema con los tokens de radio
    When se resuelven los tokens --radius-* de xs a 4xl
    Then todos valen 0
    And un elemento con rounded-full conserva su radio circular
    And no queda ninguna clase rounded sin sufijo en src/ que renderice con radio distinto de 0

  @s5
  Scenario: FAQ y Loading usan Tailwind y no queda styled-components
    Given la pantalla de FAQ y el indicador Loading renderizados
    When se inspeccionan sus estilos y las dependencias del proyecto
    Then el título de FAQ tiene las clases text-primary y font-display
    And la pregunta tiene text-on-surface y la respuesta text-on-surface-variant
    And los tres puntos de Loading tienen bg-primary, rounded-full, animate-bounce y delays 0, 0.2s y 0.4s
    And los roles, textos, aria-* y data-testid existentes se conservan
    And no existen GlobalStyles.ts, FaqPage.styles.ts ni Loading.styles.ts
    And package.json no declara styled-components ni @types/styled-components
    And no queda ningún var(--color-gold) ni var(--color-text-) en src/

  @s6
  Scenario: Ningún archivo del proyecto nombra la marca de referencia
    Given el test guardia con los dos términos prohibidos codificados en base64
    When recorre src/, tests/, index.html y package.json decodificando los términos en tiempo de ejecución
    Then ningún archivo contiene el primer término como palabra completa sin distinguir mayúsculas
    And ningún archivo contiene el segundo término como substring sin distinguir mayúsculas
    And el propio test guardia no contiene los términos en texto plano

  @s7
  Scenario: La app se llama "Workspace AI" en toda la interfaz y el sidebar no muestra caduceo
    Given la app renderizada en cada ruta (chat, FAQ, contratos, prompts) y el archivo index.html
    When se inspeccionan el enlace de marca del sidebar, el saludo y el texto de procesando del chat, las respuestas de FAQ y el título del documento
    Then el enlace de marca del sidebar muestra "Workspace AI", conserva su destino y aria-label="Ir al chat"
    And el sidebar no contiene el glifo ⚕ ni ningún elemento con aria-label="Caduceo de Hermes"
    And el saludo empieza con "¡Hola! Soy el asistente de Workspace AI."
    And el texto de procesando es "Workspace AI está procesando tu consulta"
    And las respuestas de FAQ de búsqueda y de respuesta desconocida empiezan con "Workspace AI"
    And el <title> de index.html es "Workspace AI"
    And ningún texto renderizado ni index.html contiene "Mercurial" sin distinguir mayúsculas

  @s8
  Scenario: El asistente se identifica solo como "Asistente" en los mensajes
    Given un mensaje del asistente renderizado en el chat con una hora conocida
    When se lee el encabezado del mensaje
    Then el encabezado muestra "Asistente · <hora>"
    And ASSISTANT_NAME vale "Asistente" y no contiene el nombre de la app

  @s9
  Scenario: La pestaña del navegador muestra un favicon propio de robot
    Given index.html y la carpeta public/
    When se inspeccionan el enlace de ícono y el archivo referenciado
    Then index.html referencia /favicon.svg con type="image/svg+xml" y no referencia vite.svg
    And public/favicon.svg existe y es un SVG válido
    And public/favicon.svg contiene el color #FFE600 de relleno y el carbón #2E2E38 de contorno

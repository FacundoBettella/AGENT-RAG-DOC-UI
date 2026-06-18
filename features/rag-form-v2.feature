Feature: Formulario RAG v2 con drag & drop
  Como empleado quiero cargar documentos de texto arrastrándolos o
  seleccionándolos desde el sistema de archivos para ingestarlos en el
  índice RAG de consultas de RR.HH.

  @s1
  Scenario: Zona drag & drop visible con texto instructivo en estado inicial
    Given que el usuario abre la página de carga RAG
    When el formulario se renderiza sin archivos seleccionados
    Then se muestra una zona de drag & drop con el texto "Arrastrá tus archivos `.txt` aquí o hacé clic para seleccionar"
    And se muestra un ícono visual de carga dentro de la zona
    And el botón "Subir archivos" está deshabilitado
    And no se muestra ningún mensaje de error

  @s2
  Scenario: La zona drag & drop cambia de borde al arrastrar archivos sobre ella
    Given que el formulario está en estado inicial
    When el usuario arrastra archivos sobre la zona de drop
    Then el borde de la zona cambia al color dorado brillante
    And no se muestra ningún mensaje de error

  @s3
  Scenario: Selección de archivos .txt válidos mediante click — aparecen en la lista con nombre y tamaño
    Given que el formulario está en estado inicial
    When el usuario selecciona dos archivos .txt menores a 2 MB mediante el selector de archivos nativo
    Then ambos archivos aparecen en la lista con su nombre
    And cada archivo muestra su tamaño en formato legible (KB si menor a 1 MB, MB con un decimal si mayor o igual a 1 MB)
    And cada archivo muestra un botón de eliminar "×"
    And el resumen al pie muestra el total de archivos y el peso acumulado
    And el botón "Subir archivos" está habilitado

  @s4
  Scenario: Selección de archivos .txt válidos mediante drag & drop — aparecen en la lista
    Given que el formulario está en estado inicial
    When el usuario suelta dos archivos .txt menores a 2 MB sobre la zona de drop
    Then ambos archivos aparecen en la lista con su nombre y tamaño
    And el botón "Subir archivos" está habilitado

  @s5
  Scenario: Botón de eliminar archivo individual quita el archivo de la lista
    Given que el formulario tiene dos archivos .txt válidos en la lista
    When el usuario hace clic en el botón "×" del primer archivo
    Then el primer archivo desaparece de la lista
    And el segundo archivo permanece en la lista
    And el resumen al pie refleja el nuevo conteo y peso total

  @s6
  Scenario: Eliminar el único archivo deja la lista vacía y deshabilita el botón
    Given que el formulario tiene exactamente un archivo .txt válido en la lista
    When el usuario hace clic en el botón "×" de ese archivo
    Then la lista de archivos queda vacía
    And el botón "Subir archivos" está deshabilitado
    And no se muestra ningún mensaje de error de validación

  @s7
  Scenario: Archivo mayor a 2 MB muestra error inline y no se agrega a la lista
    Given que el formulario está en estado inicial
    When el usuario selecciona un archivo .txt de 3 MB
    Then el archivo no aparece en la lista
    And se muestra un mensaje de error inline que indica que el archivo supera el límite de 2 MB
    And el botón "Subir archivos" está deshabilitado

  @s8
  Scenario: Archivo de exactamente 2 MB es aceptado (límite estricto)
    Given que el formulario está en estado inicial
    When el usuario selecciona un archivo .txt de exactamente 2 MB
    Then el archivo aparece en la lista con su nombre y tamaño
    And no se muestra ningún mensaje de error
    And el botón "Subir archivos" está habilitado

  @s9
  Scenario: Lote mixto con archivos válidos e inválidos — los válidos se agregan y se muestra error por los omitidos
    Given que el formulario está en estado inicial
    When el usuario selecciona un lote de tres archivos .txt donde uno supera 2 MB
    Then los dos archivos que cumplen el límite aparecen en la lista
    And el archivo que supera el límite no aparece en la lista
    And se muestra un mensaje de error inline indicando que el archivo omitido supera el límite de 2 MB

  @s10
  Scenario: Total acumulado mayor a 8 MB muestra error inline y no permite envío
    Given que el formulario tiene archivos .txt válidos que acumulan 7 MB
    When el usuario agrega un archivo .txt de 2 MB que llevaría el total a 9 MB
    Then el archivo nuevo no se agrega a la lista
    And se muestra un mensaje de error inline que indica que el total superaría los 8 MB
    And el botón "Subir archivos" está deshabilitado

  @s11
  Scenario: Eliminar un archivo cuando el total superaba el límite limpia el error de validación
    Given que el formulario tiene un error activo de peso total superado
    When el usuario hace clic en el botón "×" de un archivo para bajar el total por debajo del límite
    Then el mensaje de error de validación desaparece
    And el botón "Subir archivos" se habilita si hay al menos un archivo

  @s12
  Scenario: Más de 4 archivos muestra error inline y no permite envío
    Given que el formulario tiene 4 archivos .txt válidos en la lista
    When el usuario intenta agregar un archivo .txt adicional
    Then el archivo adicional no aparece en la lista
    And se muestra un mensaje de error inline que indica que no se pueden agregar más de 4 archivos
    And el botón "Subir archivos" está deshabilitado

  @s13
  Scenario: Archivo con extensión distinta de .txt es rechazado silenciosamente
    Given que el formulario está en estado inicial
    When el usuario selecciona un archivo .pdf
    Then el archivo .pdf no aparece en la lista
    And no se muestra ningún mensaje de error
    And el botón "Subir archivos" está deshabilitado

  @s14
  Scenario: Archivo duplicado (mismo nombre) se ignora silenciosamente
    Given que el formulario tiene un archivo "politicas.txt" en la lista
    When el usuario selecciona nuevamente un archivo con el nombre "politicas.txt"
    Then la lista muestra solo una entrada con el nombre "politicas.txt"
    And no se muestra ningún mensaje de error

  @s15
  Scenario: El botón "Subir archivos" está deshabilitado si no hay archivos válidos
    Given que el formulario está en estado inicial sin archivos en la lista
    When el formulario se renderiza
    Then el botón "Subir archivos" está deshabilitado

  @s16
  Scenario: El botón "Subir archivos" está deshabilitado mientras hay errores de validación activos
    Given que el formulario tiene un error de validación activo por exceso de tamaño
    When el formulario se renderiza con ese error
    Then el botón "Subir archivos" está deshabilitado

  @s17
  Scenario: Envío exitoso muestra feedback de éxito y limpia el formulario
    Given que el formulario tiene archivos .txt válidos y el servicio de ingesta está mockeado con respuesta exitosa
    When el usuario hace clic en "Subir archivos"
    Then se muestra un indicador de carga mientras se procesa
    And al completarse se muestra un mensaje de éxito
    And la lista de archivos queda vacía
    And el botón "Subir archivos" vuelve a estar deshabilitado

  @s18
  Scenario: Error del backend muestra mensaje inline con opción de reintentar
    Given que el formulario tiene archivos .txt válidos y el servicio de ingesta está mockeado con error de API
    When el usuario hace clic en "Subir archivos"
    Then se muestra el mensaje de error del backend de forma inline
    And se muestra un botón "Reintentar"
    And la lista de archivos se mantiene intacta

  @s19
  Scenario: El botón "Reintentar" vuelve a llamar al servicio con los mismos archivos
    Given que el formulario está en estado de error de API con archivos en la lista y el servicio mockeado para responder exitosamente
    When el usuario hace clic en "Reintentar"
    Then se llama nuevamente al servicio de ingesta con los mismos archivos
    And se muestra el indicador de carga
    And al completarse se muestra el mensaje de éxito y la lista se vacía

  @s20
  Scenario: Indicador de conteo y peso total de archivos seleccionados
    Given que el formulario tiene tres archivos .txt válidos con pesos 0.5 MB, 0.6 MB y 0.3 MB
    When el formulario se renderiza con esos archivos en la lista
    Then el resumen al pie muestra "3 archivos" y el peso acumulado total expresado en MB con un decimal

  @s21
  Scenario: La zona drag & drop y los botones de eliminar están deshabilitados durante la carga
    Given que el formulario tiene archivos .txt válidos y el envío está en progreso
    When el formulario se renderiza con isLoading en true
    Then la zona de drag & drop tiene apariencia deshabilitada (opacidad reducida y cursor not-allowed)
    And los botones de eliminar "×" de cada archivo están deshabilitados
    And no se pueden agregar nuevos archivos

  @s22
  Scenario: Drop sobre la zona durante la carga es ignorado
    Given que el formulario tiene archivos en la lista y el envío está en progreso
    When el usuario arrastra y suelta un archivo sobre la zona de drop
    Then la lista de archivos no cambia
    And el borde de la zona no cambia al color dorado

  @s23
  Scenario: Archivo de 0 bytes es aceptado y muestra "0 KB" en la lista
    Given que el formulario está en estado inicial
    When el usuario selecciona un archivo .txt de 0 bytes
    Then el archivo aparece en la lista con su nombre
    And el tamaño mostrado es "0 KB"
    And el botón "Subir archivos" está habilitado

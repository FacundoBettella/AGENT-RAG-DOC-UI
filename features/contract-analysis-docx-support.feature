Feature: Analizador de Contratos — soporte de .docx además de imágenes
  Como empleado de Mercurial quiero poder subir el contrato original y su enmienda
  en formato .docx, además de imágenes, para no tener que escanear documentos que
  ya tengo en Word.

  # Hereda de contract-analysis.feature (12, done): layout, envío exitoso, estados
  # del panel, contrato de red y el resto de las validaciones no relacionadas con
  # el formato de archivo. Esta feature cubre solo el delta: qué formatos se
  # aceptan, cómo se comunican y el ícono según el tipo.

  @s1
  Scenario: Acepta un archivo .docx válido en la dropzone
    Given que la dropzone "Contrato original" está vacía
    When el usuario selecciona el archivo "contrato.docx" de 2 MB para esa dropzone
    Then la dropzone "Contrato original" muestra el archivo "contrato.docx"
    And no se muestra ningún mensaje de error en la dropzone "Contrato original"

  @s2
  Scenario: El ícono del archivo cargado depende del tipo, y original y enmienda pueden ser de tipos distintos
    Given que el usuario cargó "contrato.docx" en la dropzone "Contrato original" y "enmienda.png" en la dropzone "Enmienda"
    When ambas dropzones se renderizan con sus archivos cargados
    Then el ícono del archivo cargado en la dropzone "Contrato original" es "description"
    And el ícono del archivo cargado en la dropzone "Enmienda" es "image"
    And ninguna de las dos dropzones muestra un mensaje de error

  @s3
  Scenario: Rechaza un archivo .doc legado con el mensaje de error actualizado
    Given que la dropzone "Contrato original" está vacía
    When el usuario selecciona el archivo "contrato.doc" para esa dropzone
    Then se muestra el mensaje "Formato no soportado. Subí un archivo .png, .jpg, .jpeg o .docx." en la dropzone "Contrato original"
    And la dropzone "Contrato original" permanece vacía
    And no se llama a docAgentService.analyze

  @s4
  Scenario: El límite de 10 MB también aplica a los archivos .docx
    Given que la dropzone "Enmienda" está vacía
    When el usuario selecciona el archivo "enmienda.docx" de 11 MB para esa dropzone
    Then se muestra el mensaje "El archivo supera el límite de 10 MB." en la dropzone "Enmienda"
    And la dropzone "Enmienda" permanece vacía
    And no se llama a docAgentService.analyze

  @s5
  Scenario: La pista de la dropzone comunica los formatos soportados incluyendo DOCX
    Given que el usuario abre la pantalla del Analizador de Contratos
    When la dropzone "Contrato original" se renderiza vacía
    Then se muestra el texto "PNG, JPG o DOCX (máx. 10 MB)" en la dropzone "Contrato original"

# Trazabilidad TDD — rag-form-v2

## Ciclos Rojo-Verde-Refactor

Todos los escenarios cubiertos en `tests/RagFormV2.test.tsx`.

## Trazabilidad

- @s1 (zona drag & drop visible con texto instructivo) → RagFormV2.test.tsx: "muestra el texto instructivo de la zona drag & drop", "muestra un ícono visual de carga dentro de la zona", "el botón Subir archivos está deshabilitado sin archivos", "no se muestra ningún mensaje de error en estado inicial"
- @s2 (borde dorado al arrastrar) → RagFormV2.test.tsx: "la zona tiene el atributo data-dragging=true al hacer dragover", "no se muestra ningún mensaje de error al hacer dragover"
- @s3 (selección de archivos válidos por click) → RagFormV2.test.tsx: "los archivos aparecen en la lista con su nombre", "cada archivo muestra su tamaño en KB si es menor a 1 MB", "cada archivo muestra su tamaño en MB con un decimal si es >= 1 MB", "cada archivo muestra un botón de eliminar ×", "el resumen al pie muestra el total de archivos y peso acumulado", "el botón Subir archivos está habilitado con archivos válidos"
- @s4 (selección por drag & drop) → RagFormV2.test.tsx: "los archivos aparecen en la lista al soltarlos sobre la zona", "el botón Subir archivos se habilita después del drop"
- @s5 (botón × quita el archivo) → RagFormV2.test.tsx: "el primer archivo desaparece al hacer clic en su ×", "el segundo archivo permanece en la lista", "el resumen refleja el nuevo conteo y peso total después de eliminar"
- @s6 (eliminar el único archivo) → RagFormV2.test.tsx: "la lista de archivos queda vacía", "el botón Subir archivos queda deshabilitado", "no se muestra mensaje de error de validación"
- @s7 (archivo > 2 MB muestra error) → RagFormV2.test.tsx: "el archivo no aparece en la lista", "se muestra un mensaje de error inline sobre el límite de 2 MB", "el botón Subir archivos está deshabilitado"
- @s8 (archivo de exactamente 2 MB aceptado) → RagFormV2.test.tsx: "el archivo aparece en la lista con nombre y tamaño", "no se muestra ningún mensaje de error", "el botón Subir archivos está habilitado"
- @s9 (lote mixto) → RagFormV2.test.tsx: "los archivos válidos aparecen en la lista", "el archivo inválido no aparece en la lista", "se muestra error inline indicando que el archivo omitido supera 2 MB"
- @s10 (total > 8 MB) → RagFormV2.test.tsx: "el archivo en exceso no se agrega si superaría los 8 MB", "se muestra un mensaje de error indicando que el total superaría los 8 MB", "el botón Subir archivos está deshabilitado cuando hay error de total"
- @s11 (eliminar archivo limpia error de peso total) → RagFormV2.test.tsx: "el mensaje de error desaparece al bajar el total por debajo del límite", "el botón Subir archivos se habilita si hay al menos un archivo"
- @s12 (más de 4 archivos muestra error) → RagFormV2.test.tsx: "el archivo adicional no aparece en la lista cuando ya hay 4", "se muestra un mensaje de error sobre el límite de 4 archivos", "el botón Subir archivos está deshabilitado con error de conteo"
- @s13 (archivo .pdf rechazado silenciosamente) → RagFormV2.test.tsx: "el archivo .pdf no aparece en la lista", "no se muestra ningún mensaje de error", "el botón Subir archivos está deshabilitado"
- @s14 (archivo duplicado ignorado silenciosamente) → RagFormV2.test.tsx: "la lista muestra solo una entrada con el nombre duplicado", "no se muestra ningún mensaje de error"
- @s15 (botón deshabilitado sin archivos válidos) → RagFormV2.test.tsx: "el botón Subir archivos está deshabilitado en estado inicial"
- @s16 (botón deshabilitado con error de validación activo) → RagFormV2.test.tsx: "el botón Subir archivos está deshabilitado cuando hay error de tamaño"
- @s17 (envío exitoso) → RagFormV2.test.tsx: "muestra indicador de carga mientras se procesa", "al completarse muestra mensaje de éxito", "la lista de archivos queda vacía después del éxito", "el botón Subir archivos vuelve a estar deshabilitado después del éxito"
- @s18 (error del backend con Reintentar) → RagFormV2.test.tsx: "se muestra el mensaje de error del backend de forma inline", "se muestra un botón Reintentar", "la lista de archivos se mantiene intacta tras el error"
- @s19 (Reintentar vuelve a llamar al servicio) → RagFormV2.test.tsx: "llama al servicio y muestra éxito al reintentar exitosamente", "muestra indicador de carga al reintentar"
- @s20 (resumen de archivos) → RagFormV2.test.tsx: "muestra 3 archivos y el peso total en MB con un decimal"
- @s21 (zona y botones × deshabilitados durante carga) → RagFormV2.test.tsx: "la zona de drag & drop tiene apariencia deshabilitada durante la carga", "los botones × están deshabilitados durante la carga"
- @s22 (drop ignorado durante carga) → RagFormV2.test.tsx: "la lista no cambia si se suelta un archivo mientras está cargando", "el borde no cambia al color dorado durante la carga"
- @s23 (archivo de 0 bytes aceptado) → RagFormV2.test.tsx: "el archivo aparece en la lista con su nombre", "el tamaño mostrado es 0 KB", "el botón Subir archivos está habilitado"

## Notas de implementación

- `useRagForm.ts` es el hook nuevo; `useRagUpload.ts` se mantiene sin cambios para no romper tests existentes.
- El orden de validación dentro de `addFiles` es: extensión (silencioso) → duplicado (silencioso) → tamaño individual (error) → total acumulado (error) → conteo (error). Este orden permite que el total sea testeado aun cuando el conteo también lo superaría.
- `formatFileSize` exportada para uso en componentes.
- La zona de drop expone `data-dragging` y `data-loading` como atributos para reflejar estado (sin CSS-in-JS para tests).

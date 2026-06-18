## Trazabilidad — feature: analytics

- @s1 (chat_message_sent con question_length) → analyticsService.test.ts: "llama a console.info con ..." + analyticsHooks.test.ts: "trackEvent es llamado con 'chat_message_sent' y question_length al enviar"
- @s2 (chat_message_sent no incluye texto de la pregunta) → analyticsService.test.ts: "console.info contiene question_length pero no el texto" + analyticsHooks.test.ts: "el payload no contiene el texto de la pregunta"
- @s3 (chat_retry_clicked al reintentar) → analyticsHooks.test.ts: "trackEvent es llamado con 'chat_retry_clicked' y question_length=20 al reintentar"
- @s4 (rag_files_selected al seleccionar archivos) → analyticsHooks.test.ts: "trackEvent es llamado con 'rag_files_selected', file_count=3 y total_size_bytes=2048"
- @s5 (rag_form_submitted al completar ingesta) → analyticsHooks.test.ts: "trackEvent es llamado con 'rag_form_submitted', file_count=2 y total_size_bytes=1024"
- @s6 (trackEvent sin payload emite solo el nombre) → analyticsService.test.ts: "console.info es llamado con '[analytics] chat_message_sent' (sin payload)"
- @s7 (trackEvent con payload vacío emite nombre y {}) → analyticsService.test.ts: "console.info es llamado con '[analytics] chat_message_sent {}'"
- @s8 (no propaga excepciones) → analyticsService.test.ts: "retorna sin lanzar aunque console.info lance un Error"
- @s9 (payload circular se descarta silenciosamente) → analyticsService.test.ts: "console.info NO es llamado y la llamada retorna sin lanzar excepción"
- @s10 (chat_message_sent antes del fetch) → analyticsHooks.test.ts: "trackEvent es llamado antes de hrService.query"
- @s11 (error de API no duplica chat_message_sent) → analyticsHooks.test.ts: "trackEvent es llamado exactamente una vez con 'chat_message_sent'"
- @s12 (VITE_GA_ID → ReactGA.event en lugar de console.info) → analyticsService.test.ts: "ReactGA.event es llamado y console.info NO es llamado cuando VITE_GA_ID está presente"

# Mutantes equivalentes excluidos — hr-chat

## HrChat.tsx

### [13] && → || — línea 40: guarda del scroll
- Mutación: `bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function'`
  → `bottomRef.current || typeof ...`
- Motivo: en el entorno de test (y en uso normal), `bottomRef.current` nunca es `null`
  cuando el efecto dispara porque el componente está montado. La rama null nunca se
  ejercita. El comportamiento observable es idéntico.

### [16] - → + — `-` en comentario `// Auto-focus on mount`
- Mutación: carácter `-` dentro de un comentario de código.
- Motivo: los comentarios no tienen efecto en runtime. Ningún test puede distinguir
  el código con o sin esa mutación. Equivalente estructural por definición.

### [17] - → + — `-` en comentario `// Re-focus after loading ends`
- Mutación: carácter `-` dentro de un comentario de código.
- Motivo idéntico al [16].

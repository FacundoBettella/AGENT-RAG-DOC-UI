## Trazabilidad — header-polish

- @s1 (título y subtítulo inline) → HeaderPolish.test.tsx: "muestra 'Mercurial', el separador '—' y 'Consultas de RR.HH.' en el header"
- @s2 (título es enlace a "/") → HeaderPolish.test.tsx: "existe un enlace con href '/' que contiene el texto 'Mercurial'"
- @s3 (aria-label accesible) → HeaderPolish.test.tsx: "el enlace del header tiene aria-label 'Ir al chat'"
- @s4 (navegación desde /rag) → HeaderPolish.test.tsx: "desde '/rag' el enlace del header lleva a '/'"
- @s5 (navegación desde /faq) → HeaderPolish.test.tsx: "desde '/faq' el enlace del header lleva a '/'"
- @s6 (clic en "/" sin error) → HeaderPolish.test.tsx: "desde '/' el enlace del header sigue apuntando a '/'"
- @s7 (sin text-decoration) → HeaderPolish.test.tsx: "el enlace del header tiene text-decoration: none en su estilo"
- @s8 (caduceo dentro del enlace) → HeaderPolish.test.tsx: "el símbolo ⚕ está contenido dentro del enlace"
- @s9 (GearButton fuera del enlace) → HeaderPolish.test.tsx: "el botón de configuración ⚙ existe y NO está dentro del enlace"
- @s10 (viewport 320px) → HeaderPolish.test.tsx: "en viewport de 320px el enlace del header sigue presente"

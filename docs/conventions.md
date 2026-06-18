# Convenciones de código

> Homogeneidad extrema. La IA predice mejor cuando el repositorio se parece
> a sí mismo en todas partes.

## Stack y versiones

- **React 18+** con TypeScript en modo `strict`.
- **Vitest** (o Jest) como test runner. **@testing-library/react** para
  tests de componentes y hooks.
- **ESLint** + **Prettier**: el formateador manda; el linter no tiene
  excepciones deshabilitadas sin comentario justificado.
- Líneas máximo **100 caracteres**.

## Nombres

| Tipo                         | Convención       | Ejemplo                   |
|------------------------------|------------------|---------------------------|
| Componentes React            | `PascalCase`     | `LoginForm`               |
| Hooks                        | `camelCase` + `use` | `useAuthSession`       |
| Services / utils             | `camelCase`      | `authService`             |
| Archivos de componente       | `PascalCase.tsx` | `LoginForm.tsx`           |
| Archivos de hook / service   | `camelCase.ts`   | `useAuthSession.ts`       |
| Archivos de test             | `*.test.ts(x)`   | `LoginForm.test.tsx`      |
| Tipos e interfaces           | `PascalCase`     | `AuthCredentials`         |
| Constantes                   | `UPPER_SNAKE`    | `MAX_RETRY_COUNT`         |
| Variables / funciones        | `camelCase`      | `isLoading`, `handleSubmit` |

## TypeScript

- `strict: true` en `tsconfig.json`. Sin excepciones.
- Prohibido `any`. Si el tipo no existe, créalo en `src/types/`.
- Preferir `type` sobre `interface` salvo que se necesite extensión.
- Las funciones que pueden fallar devuelven `Promise<Result>` o lanzan
  `Error` tipado — nunca `null` silencioso.

## React

- Componentes como **function components**. Sin class components.
- **Props** tipadas con `type Props = { ... }` local al archivo.
- Un componente = un archivo = una responsabilidad.
- No usar `useEffect` para derivar estado (usar `useMemo` o calcular en
  render). Sí usar `useEffect` para sincronizar con el exterior.
- No dejar `console.log` en código entregado.

## Testing (@testing-library/react)

- Queries por **rol accesible**: `getByRole`, `getByLabelText`.
  Evitar `getByTestId` salvo último recurso.
- Los tests describen comportamiento visible, no implementación:
  `it("muestra el mensaje de error cuando el login falla", ...)`.
- Cada test es **independiente** (no comparte estado entre tests).
- Los services se mockean con `vi.mock` / `jest.mock` en los tests de
  componentes y hooks.

## Estructura de archivo (componente)

```tsx
// Imports externos
import { useState } from "react";
// Imports internos (tipos, hooks, services)
import { useAuthSession } from "../hooks/useAuthSession";

// Tipos locales
type Props = { onSuccess: () => void };

// Componente (default export)
export default function LoginForm({ onSuccess }: Props) {
  // ...
}
```

from **future** import annotations

# imports stdlib

import json
import os

## Tests (@testing-library/react)

- Un archivo de test por módulo/componente: `LoginForm.test.tsx`, `useAuthSession.test.ts`.
- Descripción del test en lenguaje de usuario:
  `it("muestra el mensaje de error cuando el login falla")`.
- Cada test es independiente: sin estado compartido entre tests.
- Los services se mockean con `vi.mock` / `jest.mock` en los tests de
  componentes y hooks.
- Queries por rol accesible (`getByRole`, `getByLabelText`).
  Solo `getByTestId` como último recurso.

## Manejo de errores

- Los services lanzan `Error` con mensaje claro cuando la operación falla.
- Los hooks capturan y exponen `{ error: string | null }`.
- Los componentes muestran el mensaje de error al usuario.
- Nunca `console.error` silencioso ni `catch (() => {})`.

## Comentarios

Por defecto **no** se escriben. Solo se permiten cuando explican un *por qué*
no obvio. Los nombres y la estructura deben hacer el resto.

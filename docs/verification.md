# Verificación — Cómo demostrar que el trabajo funciona

> Regla de oro: **el agente no dice "funciona", lo demuestra**.
> Toda feature termina con evidencia ejecutable, no con afirmaciones.

> **Nota de stack:** los principios de este doc son agnósticos; los ejemplos
> de código (RTL, vitest) son del perfil react. Tu perfil activo tiene sus
> propias guías en `profiles/active/docs/`.

## Niveles de verificación

### Nivel 1 — Tests unitarios (obligatorio)

Toda función pública en `src/services/` tiene al menos un test que:

1. Cubre el camino feliz.
2. Cubre al menos un camino de error si la función puede fallar.

```bash
bash profiles/active/test.sh   # cadena completa: typecheck + lint + tests
npm test -- --run              # solo el runner (equivale al modo fast; ejemplo del perfil react)
```

El runner no chequea tipos (vitest transpila borrando las anotaciones): el
typecheck y el lint de la cadena no son opcionales para dar una feature por
verificada.

**Sin perfil activo:** el hook de verificación corre `npm test -- --run` si
detecta `package.json` en la raíz; si no hay ni perfil ni `package.json`,
avisa que no hay runner configurado en vez de asumir un stack — activá un
perfil (`./init.sh`) o corré la suite de tu stack a mano.

### Nivel 2 — Tests de componentes y hooks (obligatorio para features de UI)

Cada componente y hook expuesto al usuario tiene tests con
`@testing-library/react` que verifican comportamiento **observable**:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../LoginForm";

it("muestra el campo de email", () => {
  render(<LoginForm onSuccess={vi.fn()} />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});

it("llama a onSuccess cuando el login es exitoso", async () => {
  vi.mock("../../services/authService", () => ({
    login: vi.fn().mockResolvedValue({ token: "abc" }),
  }));
  const onSuccess = vi.fn();
  render(<LoginForm onSuccess={onSuccess} />);
  await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
  await userEvent.type(screen.getByLabelText(/contraseña/i), "secret");
  await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
  expect(onSuccess).toHaveBeenCalledTimes(1);
});
```

## Patrones de test en RTL

### Queries — orden de preferencia

1. `getByRole` (accesible) — usa siempre que puedas.
2. `getByLabelText` — para inputs con label.
3. `getByPlaceholderText`, `getByText` — cuando no hay alternativa.
4. `getByTestId` — último recurso, requiere justificación.

### Aserciones preferidas

```tsx
expect(screen.getByRole("alert")).toHaveTextContent("Email inválido");
expect(screen.getByRole("button", { name: /entrar/i })).toBeDisabled();
expect(onLogin).toHaveBeenCalledWith({ email: "a@b.com", password: "s" });
```

### Mocking de services

```ts
vi.mock("../../services/authService");
const mockLogin = vi.mocked(login);
mockLogin.mockResolvedValue({ token: "tok" });
```

### Hooks con `renderHook`

```ts
import { renderHook, act } from "@testing-library/react";

it("expone isLoading = true mientras hace fetch", async () => {
  const { result } = renderHook(() => useAuthSession());
  expect(result.current.isLoading).toBe(true);
  await act(async () => { /* esperar promesas pendientes */ });
  expect(result.current.isLoading).toBe(false);
});
```

## Lo que NO cuenta como verificación

- Un test que sólo comprueba que el componente "renderiza sin errores"
  (aporta cero cobertura de comportamiento).
- Capturas de pantalla manuales.
- "Lo probé en el navegador" sin test automático.

## Fidelidad visual (features con pantalla)

No es un nivel de verificación del agente — es una puerta humana. Ni el
`developer` ni el `reviewer` levantan browser, sacan capturas ni instalan
Playwright/Chromium para chequear esto: el `developer` deja el dev server
corriendo y devuelve la URL; el `tech-lead` se la pasa al humano (junto con
el mockup de referencia si existe en `progress/mockups/<name>/`) y espera su
OK antes de mandar a review. Ver "Puerta visual" en `agents/tech-lead.md`.

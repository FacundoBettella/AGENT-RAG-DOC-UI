# Verificación — Cómo demostrar que el trabajo funciona

> Regla de oro: **el agente no dice "funciona", lo demuestra**.
> Toda feature termina con evidencia ejecutable, no con afirmaciones.

## Niveles de verificación

### Nivel 1 — Tests unitarios (obligatorio)

Toda función pública en `src/services/` tiene al menos un test que:

1. Cubre el camino feliz.
2. Cubre al menos un camino de error si la función puede fallar.

```bash
npm test -- --run
```

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

### Nivel 3 — Prueba de mutación (obligatorio antes de `done`)

Una suite verde no garantiza que los tests sirvan. La prueba de mutación
verifica que algún test falla cuando el código se rompe:

```bash
node tools/mutate.mjs src/services/authService.ts
```

El score debe ser **100% sobre las líneas nuevas o tocadas** por la feature
(ver `docs/mutation-testing.md`).

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

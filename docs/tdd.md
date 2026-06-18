# TDD estricto — la disciplina del `developer`

> "Do you let it write all tests up front, then code or single test
> followed by code (TDD)?" — La respuesta de esta rama: **single test
> followed by code**. Un test a la vez. Nunca toda la batería por delante.

## Las Tres Leyes del TDD

1. **No escribes código de producción** salvo para hacer pasar un test que
   está fallando.
2. **No escribes más de un test del necesario para fallar** — y que no
   compile o no importe cuenta como fallar.
3. **No escribes más código de producción del necesario** para pasar el
   único test que falla.

El efecto: nunca tienes código sin un test que lo justifique, ni un test
que no esté empujando código real. El alcance no se infla.

## El ciclo, en pequeño y repetido

```
   ┌──────────────────────────────────────────────┐
   │                                                │
   ▼                                                │
 ROJO            VERDE                 REFACTOR      │
 escribe UN  →   mínimo código    →    limpia con   ─┘
 test que        para ponerlo          la barra
 falla           verde                 verde
```

- **ROJO** — el test deriva del siguiente escenario `@s` del `.feature`.
  Verifícalo fallando de verdad (`npm test -- --run`). Un test que
  pasa a la primera no demuestra nada: ajústalo o sospecha del montaje.
- **VERDE** — la implementación **mínima**. Está permitido hacer trampa
  (devolver una constante) si aún no hay test que lo desmienta. El
  siguiente ciclo forzará la generalización. Esto es deliberado.
- **REFACTOR** — solo en verde. Elimina duplicación, mejora nombres,
  parte funciones largas. Vuelve a correr los tests tras cada cambio. Si
  algo se pone rojo, no estás refactorizando: estás cambiando comportamiento.

## Granularidad: un escenario, uno o más ciclos

Cada `@s` del `.feature` se traduce en al menos un ciclo Rojo-Verde-
Refactor. Un escenario con varias aristas puede necesitar dos ciclos para
forzar la generalización del código.

## Comandos

```bash
# Correr todos los tests
npm test -- --run

# Correr solo un archivo de test (Vitest)
npm test -- --run src/features/login/LoginForm.test.tsx

# Modo watch para el ciclo Rojo-Verde
npm test
```

## Ejemplos de ciclo ROJO-VERDE con RTL

### Componente

```tsx
// ROJO: escribe el test que falla
it("muestra el botón Entrar", () => {
  render(<LoginForm onSuccess={vi.fn()} />);
  expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
});

// VERDE: el mínimo que lo pone verde
export default function LoginForm({ onSuccess }: Props) {
  return <button>Entrar</button>;
}
```

### Hook

```ts
// ROJO: el test falla porque isLoading no existe todavía
it("inicia con isLoading = false", () => {
  const { result } = renderHook(() => useAuthSession());
  expect(result.current.isLoading).toBe(false);
});

// VERDE: el mínimo que lo pone verde
export function useAuthSession() {
  return { isLoading: false };
}
```

### Service (puro, sin JSX)

```ts
// ROJO
it("lanza Error si las credenciales son inválidas", async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response);
  await expect(login("a@b.com", "wrong")).rejects.toThrow("Credenciales inválidas");
});

// VERDE
export async function login(email: string, password: string) {
  const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return res.json();
}
```

## Trazabilidad obligatoria

Al cerrar, cada `@s` debe estar cubierto por al menos un test concreto.
El `developer` escribe el mapa en `progress/tdd_<name>.md`:

```markdown
## Trazabilidad
- @s1 (renderiza campo email) → LoginForm.test.tsx: "muestra el campo de email"
- @s2 (botón deshabilitado sin datos) → LoginForm.test.tsx: "botón deshabilitado"
- @s3 (llama al service con las credenciales) → LoginForm.test.tsx: "llama a login"
```

El `reviewer` rechaza si algún `@s` queda sin test, y el `qa`
rechaza si los tests existen pero no muerden.

## Olores que el `reviewer` busca

- Código de producción que **ningún test rojo** pidió (viola la Ley 1).
- Tests escritos "a futuro" para escenarios que aún no toca.
- Refactors hechos en rojo.
- Componentes que hacen `fetch` directamente (viola `docs/architecture.md`).
- Funciones largas o nombres opacos que sobrevivieron al paso REFACTOR.

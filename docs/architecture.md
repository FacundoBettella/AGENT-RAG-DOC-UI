# Arquitectura — Qué significa "hacer un buen trabajo"

> Este documento define el estándar de calidad. Los agentes revisores
> evalúan código contra este archivo. Si no está aquí, no es un requisito.

## Capas del frontend

El proyecto sigue una arquitectura de capas estricta. Cada capa solo
importa de capas inferiores; nunca al revés.

```
pages/          — rutas de la app (React Router). Solo componen features.
features/       — secciones completas de UI. Componen components + hooks.
components/     — componentes reutilizables, sin lógica de negocio.
hooks/          — lógica de estado y efectos. Solo llaman a services.
services/       — llamadas HTTP / lógica pura. Sin JSX, sin useState.
store/          — estado global (Zustand / Redux / Context). Sin JSX.
router/         — configuración de rutas (React Router). Sin estado.
```

### Reglas de dependencia

| Capa         | Puede importar de                        | No puede importar de       |
|--------------|------------------------------------------|----------------------------|
| `pages/`     | `features/`, `router/`                   | —                          |
| `features/`  | `components/`, `hooks/`, `store/`        | `pages/`                   |
| `components/`| `hooks/` (propios), `store/`             | `features/`, `pages/`      |
| `hooks/`     | `services/`, `store/`                    | `components/`, `features/` |
| `services/`  | utilidades puras                         | todo lo de UI              |
| `store/`     | `services/` (selectores/acciones)        | `components/`, `features/` |

## Principios

1. **Separación fetch / render.** Ningún componente llama a `fetch` o
   `axios` directamente. Las llamadas HTTP viven en `services/`. Los
   componentes consumen hooks que consumen services.

2. **Estado local vs. global.** El estado que solo necesita un componente
   vive en `useState`. El estado compartido entre rutas vive en `store/`.
   No usar `store/` para estado efímero de formularios.

3. **Errores explícitos.** Los services lanzan `Error` tipados con mensaje
   claro. Los hooks capturan y exponen `{ error: string | null }`. Los
   componentes muestran el mensaje de error al usuario — nunca `console.error`
   silencioso.

4. **Componentes puros por defecto.** Un componente recibe props y devuelve
   JSX. Los efectos secundarios (fetch, timers, subscriptions) van en hooks.

5. **Sin dependencias implícitas.** Nada de acceder a `window`, `localStorage`
   o `document` directamente en componentes o features. Encapsular en un
   hook o service.

## Flujo de datos

```
usuario
  │
  ▼
Page (ruta)  ─→  Feature (sección)  ─→  Component (UI)
                      │                       │
                      └──── Hook ────────────►│
                               │
                               ▼
                           Service (HTTP / lógica)
                               │
                               ▼
                           API / localStorage / Store
```

## Qué NO hacer

- No llamar `fetch` / `axios` dentro de un componente o feature.
- No acceder a `localStorage` o `document` fuera de un hook/service.
- No usar `any` en TypeScript. Si el tipo no existe, créalo.
- No dejar `console.log` de debug en el código entregado.
- No mezclar lógica de negocio con JSX en el mismo archivo.
- No crear una nueva abstracción (context, store slice) sin un test que
  la pida.

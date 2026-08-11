# Mercurial — DOC & RAG Agent UI

Frontend React (Vite + Tailwind) para dos sistemas de IA internos:

- **Chat de RR.HH./IT/Finanzas** contra `RAG AGENT API` — un orquestador que clasifica la
  consulta y la enruta al agente RAG especializado del dominio correspondiente.
- **Analizador de contratos** contra `DOC AGENT API` — sube un contrato original y su
  enmienda (imagen o `.docx`) y devuelve qué cambió entre ambos.
- **Editor de prompts** de los agentes de `DOC AGENT API`.

## Variables De Entorno

La UI consume dos backends independientes, cada uno con su propia base URL:

| Variable | Backend | Fallback en código |
|---|---|---|
| `VITE_RAG_API_BASE_URL` | RAG AGENT API (`/api/query`, `/api/ingest`) | `http://localhost:8080` |
| `VITE_DOC_AGENT_API_BASE_URL` | DOC AGENT API (`/analysis`, `/prompts`) | `http://localhost:8000` |

Se configuran en `.env.local` (gitignoreado) para desarrollo fuera de Docker, o directo en
`docker-compose.yml` para el flujo con contenedores. Verificá el puerto real de cada backend
en tu entorno — sus propios `docker-compose.yml` pueden publicar puertos distintos a los de
arriba.

## Cómo Levantar El Proyecto

La forma soportada de correr la app es **Docker** — no hace falta `npm run dev` local:

```bash
docker compose up          # levanta el front en http://localhost:5173, con hot-reload
docker compose up -d       # lo mismo, en background
docker compose down        # lo baja
docker compose up --build  # reconstruye la imagen (necesario si cambió package.json)
```

El bind mount cubre `src/` y `tests/`: si tocás `index.html`, `vite.config.ts`,
`tsconfig.json` o `package.json`, esos cambios quedan "horneados" en la imagen y necesitan
`docker compose up --build` para reflejarse.

Para que la app funcione de punta a punta, `RAG AGENT API` y `DOC AGENT API` tienen que estar
corriendo y accesibles en los puertos configurados en `VITE_RAG_API_BASE_URL`/
`VITE_DOC_AGENT_API_BASE_URL`.

`node_modules` local no es necesario — todo (dev server, tests, typecheck) corre dentro del
contenedor.

## Stack Técnico

React 18 · TypeScript · Vite · Tailwind CSS v4 · React Router · Axios · Vitest + Testing
Library.

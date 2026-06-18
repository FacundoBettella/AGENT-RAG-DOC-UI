# Modelo De Consumo Del Harness

## Estado Actual

Se evaluan tres opciones (script de instalación, plugin de Claude Code, MCP server) — ver
sección "Opciones De Distribucion Del Motor". La recomendación es arrancar con
script e iterar hacia plugin una vez que el motor esté estable.

## Objetivo Técnico

Separar dos capas:

- **Harness publicado**: backlog, contratos Gherkin, verificación mínima y utilidades.
- **Repositorio consumidor**: implementación real, tests, configuración del proyecto y código de negocio.

Este desacople permite reutilizar el mismo harness en varios proyectos sin
inyectar archivos de proceso en el árbol principal del código del cliente.

## Clasificacion De Artefactos

### 1. Artefactos publicados al repo consumible

- `feature_list.json`
- `features/`
- `init.sh`
- `tools/`

Estos artefactos constituyen el paquete portable del harness: backlog,
contratos funcionales, verificacion minima y utilidades auxiliares.

### 2. Artefactos internos compartidos del harness

- `project-spec.md`
- `AGENTS.md`
- `CHECKPOINTS.md`
- `CLAUDE.md`
- `docs/`

Estos artefactos no se publican al repo consumidor, pero tampoco son
personales. Forman parte del conocimiento interno compartido del equipo que
opera el harness.

Punto clave:

- Su función es capturar conocimiento funcional compartible: decisiones,
  casos limite, aclaraciones y trade-offs previos a la destilacion de
  `features/<name>.feature`.

### 3. Artefactos personales/locales

- `progress/current.md`
- `progress/history.md`

Estos archivos representan seguimiento local del operador y no deben formar
parte del paquete publicado ni del repositorio consumidor.

## Artefactos Publicados

Solo se publican estos artefactos:

- `feature_list.json`
  - Es el backlog operativo del proyecto.
  - Define las tareas abiertas, su estado y, si se desea, metadatos de asignación.

- `features/`
  - Contiene los contratos Gherkin por feature.
  - Es el insumo funcional portable que luego consume el repo implementador.

- `init.sh`
  - Define la verificación mínima común del harness.
  - Permite validar consistencia estructural antes de consumir o avanzar una feature.

- `tools/`
  - Agrupa utilidades reutilizables del arnés.
  - Mantiene la lógica auxiliar desacoplada del proyecto consumidor.

## Artefactos No Publicados

Estos artefactos pertenecen al funcionamiento interno del harness o al trabajo
local del operador y no forman parte del paquete publicado:

- `project-spec.md`
- `CLAUDE.md`
- `.claude/`
- `AGENTS.md`
- `CHECKPOINTS.md`
- `docs/`
- `progress/`

Motivos:

- contienen instrucciones internas del harness,
- documentan decisiones de operación, no el contrato consumible,
- o representan seguimiento personal/local que no debe mezclarse con el repo consumidor.

## Preguntas Abiertas

- Cómo se resuelve el versionado del harness respecto del proyecto que lo usa.
- Si el motor se separa en un repo propio (`harness-engine`), qué proceso de
  update y compatibilidad se define para los repos clientes que lo consumen.

---

## Opciones De Distribucion Del Motor

El motor del harness (agents, settings, docs, workflow) tiene que llegar a cada
dev del equipo. Los artefactos de proyecto (feature_list, features/,
project-spec, tools, init.sh) **viven en el harness** y el repo cliente los
consume — no se copian al cliente.

Limitacion clave de Claude Code: solo `CLAUDE.md` tiene auto-load garantizado.
`docs/`, `AGENTS.md`, `CHECKPOINTS.md` no se cargan solos — necesitan ser
referenciados desde `CLAUDE.md`.

### Opcion A — Script de instalacion (`install.sh`)

**Como funciona:**

1. El motor vive en un repo separado (`harness-engine`).
2. Cada dev clona el repo y corre `./install.sh`.
3. El script copia `agents/`, `settings.json`, `docs/`, `CLAUDE.md` a `~/.claude/`.
4. El dev trabaja en su proyecto cliente normalmente.

**Fortalezas:**

- Funciona hoy, sin dependencias externas.
- Simple de entender y auditar.
- El dev tiene control total sobre qué version instala.
- Facil de versionar con git tags.

**Debilidades:**

- Onboarding manual: clonar + correr script.
- Actualizaciones manuales: cada dev tiene que re-correr el script para actualizar.
- Sin sincronizacion automatica entre versiones.
- Si un dev no actualiza, trabaja con version vieja sin saberlo.

---

### Opcion B — Plugin de Claude Code

**Como funciona:**

Se empaqueta el motor con un `plugin.json` manifest. Se hostea en un repo
privado con un `marketplace.json`. El dev agrega el marketplace una vez y
luego instala el plugin:

```
/plugin marketplace add https://github.com/tu-org/harness-engine
/plugin install uncle-bob-harness@tu-marketplace
```

**Estructura del plugin:**

```
harness-engine/
  .claude-plugin/
    plugin.json        ← name, version, description
    marketplace.json   ← catalogo
  agents/
    tech-lead.md
    analyst.md
    developer.md
    reviewer.md
    bdd-writer.md
    qa.md
  skills/              ← pendiente: cargar las skills al harness
  hooks/
  settings.json
```

**Fortalezas:**

- Onboarding limpio: dos comandos y listo.
- Actualizaciones con `/plugin update`.
- Namespacing: skills del plugin usan prefijo, no pisan nada del dev.
- Distribucion centralizada: un repo, todos los devs consumen la misma version.
- Se puede integrar en managed settings para auto-instalar en el equipo.

**Debilidades:**

- `CLAUDE.md` no se puede empaquetar — tiene que vivir en el repo cliente
  o instalarse manualmente en `~/.claude/`.
- Requiere mantener el repo del plugin con versiones y changelog.
- Si el marketplace privado cae, los devs pierden acceso a updates.

---

### Opcion C — MCP Server

**Como funciona:**
El harness se expone como servidor MCP con herramientas del pipeline.
Cada dev configura el server en `~/.claude.json` y Claude accede a las
herramientas del harness via MCP en cualquier proyecto.

**Fortalezas:**

- Centralizado al maximo: el motor vive en un server, no en `~/.claude/` de cada dev.
- Actualizaciones transparentes: se actualiza el server, todos los devs lo reciben sin hacer nada.
- No depende del auto-load de archivos: todo va por protocolo MCP.
- Escala bien si el equipo crece mucho.

**Debilidades:**

- Requiere levantar y mantener un server — infraestructura adicional.
- Si el server cae, el harness no funciona.
- No funciona offline.
- Overkill para equipo chico (2-5 devs frontends).

---

### Comparacion

| Criterio | Script | Plugin | MCP |
|---|---|---|---|
| Funciona hoy | Si | Si | Requiere implementacion |
| Onboarding | Manual | 2 comandos | Configurar server |
| Updates | Manuales | `/plugin update` | Automaticos |
| CLAUDE.md distribuible | Si (copia) | No (limitacion) | N/A |
| Infraestructura necesaria | Ninguna | Repo privado | Server corriendo |
| Escala de equipo | Chico | Mediano | Grande |
| Complejidad | Baja | Media | Alta |

---

### Recomendacion Por Etapa

**Corto plazo:** Opcion A (script) para arrancar rapido y validar el workflow
con el equipo. Cero friccion, cero infraestructura.

**Mediano plazo:** Opcion B (plugin) una vez que el motor este estable. Mejor
UX de onboarding y updates mas limpios. Resolver la limitacion de `CLAUDE.md`
con un `CLAUDE.md` thin en cada repo cliente que diga "este proyecto usa el
harness uncle-bob".

**No ahora:** Opcion C (MCP) solo si el equipo crece significativamente o si
se necesita logica de harness que no se puede expresar con agents/settings.

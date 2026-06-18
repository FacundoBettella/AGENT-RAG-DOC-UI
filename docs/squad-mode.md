# Manual De Modos De Trabajo

Este documento define los dos flujos oficiales del harness:

- modo individual,
- modo equipo (squad).

El objetivo es usar el mismo pipeline funcional (spec -> gherkin -> tdd ->
review -> mutacion), cambiando solo las reglas de coordinacion.

## Modo Individual

Usalo cuando una sola persona lleva el proyecto o una rama aislada.

### Regla principal

- Solo una feature `in_progress` en todo el `feature_list.json`.

### Checklist de inicio

- Ejecutar `./init.sh`.
- Buscar la siguiente feature `pending`.
- Confirmar `sdd: true` si aplica el pipeline completo.

### Checklist de ejecucion

- Conversar spec en `project-spec.md`.
- Destilar contrato en `features/<name>.feature`.
- Aprobacion humana del `.feature`.
- Implementar TDD en `src/` y `tests/`.
- Correr review.
- Correr mutacion.

### Checklist de cierre

- Tests verdes.
- Contrato `.feature` alineado con lo implementado.
- Feature actualizada a `done` en `feature_list.json`.

## Modo Equipo (Squad)

Usalo cuando trabajan varios devs en paralelo sobre el mismo repositorio.

### Reglas principales

- Cada feature debe tener `owner`.
- Maximo una feature `in_progress` por `owner`.
- No mezclar varias features en una misma PR.

### Estructura recomendada en `feature_list.json`

Cada item:

- `owner`: responsable principal.
- `status`: `pending | spec_ready | in_progress | done | blocked`.

En `rules`:

- `team_mode: true`
- `max_in_progress_per_owner: 1`

### Que va al repo (compartido)

- `feature_list.json`
- `project-spec.md` (o `specs/<name>/spec.md`)
- `features/<name>.feature`
- `src/`, `tests/`

### Que NO va al repo (personal)

- `progress/current.md`
- `progress/history.md`
- `progress/local/`

### Checklist de inicio por developer

- Ejecutar `./init.sh`.
- Tomar una feature `pending` donde `owner` sea el developer actual.
- Verificar que no tenga otra feature `in_progress` para ese mismo owner.

### Checklist de cierre por developer

- PR contiene solo una feature.
- Estado en `feature_list.json` actualizado.
- Contrato `.feature` y tests alineados.

## Reglas Comunes A Ambos Modos

- `project-spec.md` y `features/<name>.feature` son artefactos compartidos.
- No cerrar una feature sin review y sin mutacion dentro del umbral.
- Si hay ambiguedad de negocio, resolver primero contrato, luego codigo.

## Migracion Rapida A Squad

Si `progress/current.md` o `progress/history.md` ya estaban trackeados:

```bash
git rm --cached progress/current.md progress/history.md
```

Luego cada dev mantiene su bitacora local sin ruido de merges.

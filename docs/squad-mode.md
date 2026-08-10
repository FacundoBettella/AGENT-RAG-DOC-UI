# Manual De Modos De Trabajo

Este documento define los dos flujos oficiales del harness:

- modo individual,
- modo equipo (squad).

El objetivo es usar el mismo pipeline funcional (spec -> gherkin ->
implementacion (TDD o test-after) -> review), cambiando solo
las reglas de coordinacion.

## Modo Individual

Usalo cuando una sola persona lleva el proyecto o una rama aislada.

### Regla principal

- Solo una feature `in_progress` en todo el `feature_list.json`.

### Checklist de inicio

- Ejecutar `./init.sh`.
- Buscar la siguiente feature `pending`.
- Confirmar `sdd: true` si aplica el pipeline completo.

### Checklist de ejecucion

- Conversar spec en `specs/<name>/spec.md` (el `tech-lead` mantiene el índice en `project-spec.md`).
- Destilar contrato en `features/<name>.feature`.
- Aprobacion humana del `.feature`.
- Eleccion humana de modo (TDD estricto o test-after) para la feature.
- Implementar en `src/` y `tests/` segun el modo elegido.
- Correr review.

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
- `project-spec.md` (índice) y `specs/<name>/spec.md` (spec por feature)
- `features/<name>.feature`
- `src/`, `tests/`

### Que NO va al repo (personal)

- `progress/current.md`

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
- No cerrar una feature sin review.
- Si hay ambiguedad de negocio, resolver primero contrato, luego codigo.

## Migracion Rapida A Squad

Si `progress/current.md` ya estaba trackeado:

```bash
git rm --cached progress/current.md
```

Luego cada dev mantiene su bitacora local sin ruido de merges.

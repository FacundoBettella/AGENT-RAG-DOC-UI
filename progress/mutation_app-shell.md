# Mutantes equivalentes excluidos — app-shell

## AppShell.tsx

### offset 335 — valor de `data-testid` (primer guion)
- Mutación: `"app-shell-root"` → `"appshell-root"`
- Motivo de exclusión: el atributo `data-testid="app-shell-root"` está declarado en el
  componente pero ningún test lo consulta. Los tests usan `getByRole` y `getByText`.
  Mutar el valor no cambia ningún comportamiento observable por la suite.
- Alternativa considerada: agregar `screen.getByTestId('app-shell-root')` en algún test.
  Descartada: duplicaría la cobertura ya provista por `getByRole('banner')` y `getByRole('main')`
  sin agregar valor semántico.

### offset 341 — valor de `data-testid` (segundo guion)
- Mutación: `"app-shell-root"` → `"app-shellroot"`
- Motivo de exclusión: idéntico al offset 335.

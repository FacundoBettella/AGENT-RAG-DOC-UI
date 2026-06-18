# Prueba de mutación — validar que los tests muerden

> "Mutation testing is resource-heavy, but the ROI on code correctness is
> worth every cycle." / "We are shifting from a bottleneck of human typing
> speed to a bottleneck of compute-driven validation."

## El problema que resuelve

Una suite verde dice "el código no explota con estas entradas". **No** dice
"los tests fallarían si el código estuviera mal". Un test sin asserts
fuertes pasa siempre y no protege nada.

La prueba de mutación lo mide al revés: introduce un defecto pequeño en el
código (un *mutante*) y observa la suite.

- Si **algún test falla** → el mutante está **muerto** (killed). Bien: la
  red atrapó el defecto.
- Si **todos los tests pasan** → el mutante **sobrevive** (survived). Mal:
  hay un agujero. Falta un assert o un caso.

**Puntuación de mutación** = `killed / total`. Cuanto más alta, más muerden
los tests.

## El mutador de este repo: `tools/mutate.mjs`

Sin dependencias externas al proyecto (no instala nada global). El script
requiere Node 16+ y usa solo la stdlib de Node (`fs`, `child_process`, `path`):

1. Lee un archivo de `src/`.
2. Aplica, **uno a uno**, un catálogo de mutaciones textuales:

   | Categoría    | Ejemplo de mutación                          |
   |--------------|----------------------------------------------|
   | Igualdad     | `===` → `!==`, `!==` → `===`                 |
   | Comparación  | `<=` → `<`, `>=` → `>`                       |
   | Lógica       | `&&` → `\|\|`, `\|\|` → `&&`                 |
   | Booleanos    | `true` → `false`, `false` → `true`           |
   | Aritmética   | `+` → `-`, `-` → `+`                         |
   | Retorno      | `return <expr>` → `return undefined`         |

3. Por cada mutante: escribe el archivo mutado, corre
   `npm test -- --run` (configurable vía `MUTATE_TEST_CMD`), restaura el original.
4. Reporta `total`, `killed`, `survived`, `score` y la lista de
   sobrevivientes (descripción de la mutación + offset en el archivo).

```bash
node tools/mutate.mjs src/services/authService.ts          # mutar un archivo
node tools/mutate.mjs src/services/authService.ts --max 50 # acotar nº de mutantes

# Para proyectos CRA/Jest:
MUTATE_TEST_CMD="npm test -- --watchAll=false --forceExit" node tools/mutate.mjs src/...
```

El script **restaura siempre** el archivo original, incluso si lo
interrumpes (maneja la limpieza en `finally`).

## Archivos excluidos del scope de mutación

No todo archivo de `src/` es candidato a mutación. Los siguientes tipos se
excluyen porque no contienen lógica de negocio — mutar sus strings o
identificadores no probaría comportamiento, solo que un literal es exactamente
ese literal:

| Patrón                          | Motivo de exclusión                                      |
|---------------------------------|----------------------------------------------------------|
| `**/GlobalStyles.ts`            | Solo declara tokens CSS (variables `--color-*`). Sin ramas ni cómputo. |
| `**/*.styles.ts`                | Archivos de estilos puros (styled-components). Sin lógica. |
| `**/*.tokens.ts`                | Archivos de constantes de diseño / paleta de colores.    |
| `**/types/*.ts`                 | Solo definiciones de tipos TypeScript. Sin runtime.      |
| `**/router/*.ts(x)`             | Configuración de rutas. Sin condicionales de negocio.    |

**Regla general:** si un archivo no tiene `if`, `&&`, `||`, `?:`, bucles ni
llamadas a funciones propias, probablemente no vale la pena mutarlo. El
`qa` debe justificar en su reporte qué archivos incluyó y por qué.

## El umbral

- Por defecto, la feature exige **100% de mutantes muertos sobre las líneas
  nuevas o tocadas** por esa feature.
- Para código heredado no tocado por la feature, no se exige umbral en esta
  rama (se mide, no se bloquea).
- Un mutante **equivalente** (no cambia el comportamiento observable; p. ej.
  mutar un valor que nunca se usa) puede excluirse, pero **solo** con
  justificación explícita escrita en `progress/mutation_<name>.md`. Abusar
  de esta vía es hacer trampa al juez.

## Quién hace qué

- El `qa` **mide** y reporta. No edita código.
- Un mutante sobreviviente es trabajo del `developer`: escribe el test
  rojo que lo mata y vuelve a pasar por el `reviewer`. Es el ciclo de mejora
  compute-bound: el CPU encuentra el hueco, el artesano lo tapa con un test.

## Por qué vale el coste

Reejecutar toda la suite por cada mutante es caro. Pero ese es justo el
desplazamiento que describe el hilo: el límite ya no es lo rápido que
teclea un humano, sino cuánta validación puede pagar tu CPU. La corrección
del código es el retorno, y compensa cada ciclo.

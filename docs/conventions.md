# Convenciones de código

> Este archivo es intencionalmente genérico y no define ninguna convención de
> código. Las convenciones reales viven en `profiles/<perfil>/docs/conventions.md`,
> que `./init.sh` materializa en `profiles/active/docs/conventions.md` según el
> `profile` declarado en `harness.json`.
>
> Sin perfil activo, ningún agente (`analyst`, `developer`, `reviewer`) tiene
> convenciones de nombres, estilo o estructura contra las cuales trabajar — y
> ninguno debe inventar unas ni asumir un stack por defecto. Corré `./init.sh` y
> elegí un perfil (`react`, `java-spring`, `python-fastapi`) antes de continuar.
>
> Este archivo existe solo porque `init.sh` verifica su presencia como parte del
> arnés base. Si alguna vez volvés a escribir convenciones de un stack específico
> acá en vez de en `profiles/<perfil>/docs/conventions.md`, todos los perfiles
> heredan ese sesgo sin darse cuenta — es exactamente el bug que este archivo
> reemplaza.

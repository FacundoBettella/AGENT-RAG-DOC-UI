# Arquitectura — Qué significa "hacer un buen trabajo"

> Este archivo es intencionalmente genérico y no define ningún estándar de
> arquitectura. El estándar real vive en `profiles/<perfil>/docs/architecture.md`,
> que `./init.sh` materializa en `profiles/active/docs/architecture.md` según el
> `profile` declarado en `harness.json`.
>
> Sin perfil activo, ningún agente (`analyst`, `developer`, `reviewer`) tiene un
> estándar de arquitectura contra el cual conversar, implementar o revisar — y
> ninguno debe inventar uno ni asumir un stack por defecto. Corré `./init.sh` y
> elegí un perfil (`react`, `java-spring`, `python-fastapi`) antes de continuar.
>
> Este archivo existe solo porque `init.sh` verifica su presencia como parte del
> arnés base (`AGENTS.md`, `feature_list.json`, `docs/architecture.md`, ...). Si
> alguna vez volvés a escribir contenido de un stack específico acá en vez de en
> `profiles/<perfil>/docs/architecture.md`, todos los perfiles heredan ese sesgo
> sin darse cuenta — es exactamente el bug que este archivo reemplaza.

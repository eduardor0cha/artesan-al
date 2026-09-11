# Registros de decisão de arquitetura (ADR)

Cada arquivo registra uma decisão, o contexto em que foi tomada, as alternativas descartadas e as
consequências. São a matéria-prima da seção de metodologia do artigo.

A transcrição integral da entrevista que originou estas decisões está em
[`0000-grilling-transcript.md`](./0000-grilling-transcript.md).

| ADR                                             | Decisão                                               |
| ----------------------------------------------- | ----------------------------------------------------- |
| [0001](./0001-stack-e-plataforma.md)            | Web PWA com Next.js full-stack                        |
| [0002](./0002-postgis-e-drizzle.md)             | PostgreSQL + PostGIS com Drizzle ORM                  |
| [0003](./0003-modelo-de-dominio.md)             | Artesão ↔ ponto de venda N:N, geolocalização no ponto |
| [0004](./0004-autocadastro-e-moderacao.md)      | Autocadastro do artesão com moderação reativa         |
| [0005](./0005-login-por-cpf.md)                 | CPF como identificador de login                       |
| [0006](./0006-clean-architecture.md)            | Clean Architecture com fronteiras impostas por lint   |
| [0007](./0007-mapa-leaflet-osm.md)              | Leaflet + OpenStreetMap                               |
| [0008](./0008-acessibilidade-como-requisito.md) | Acessibilidade como requisito verificável             |

# ArtesanAL

Plataforma geolocalizada para divulgação de artesãos e produtos artesanais de Alagoas.

O problema: artesãos alagoanos têm baixa visibilidade digital, e quem quer comprar artesanato não
sabe **onde** encontrá-lo fisicamente. A pergunta que o sistema responde é _"quais pontos de venda
de artesanato estão perto de mim, e quem e o que se vende lá?"_.

Este repositório é o artefato de software do artigo **"ArtesanAL: uma plataforma geolocalizada para
divulgação de artesãos e produtos artesanais"**.

> **Estado atual: andaime.** A infraestrutura está montada e verificada de ponta a ponta, mas as
> funcionalidades de produto (busca no mapa, painel do artesão, catálogo) ainda não foram
> construídas. O caminho até elas está fatiado em [`docs/mvp-plan.md`](./docs/mvp-plan.md). As
> decisões que guiaram a base estão em [`docs/adr/`](./docs/adr/), e as entrevistas integrais que
> as originaram em
> [`docs/adr/0000-grilling-transcript.md`](./docs/adr/0000-grilling-transcript.md).

## Requisitos

- Node 22.18 (use `nvm use` — a versão está em [`.nvmrc`](./.nvmrc))
- pnpm 12
- Docker (banco PostGIS, armazenamento MinIO e os testes de integração)

## Começando

```bash
nvm use
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

A aplicação sobe em <http://localhost:3000>. O console do MinIO fica em <http://localhost:9001>
(usuário `artesanal`, senha `artesanal123`).

Se a porta 5434 ou 9000 já estiver ocupada na sua máquina, ajuste `POSTGRES_PORT` / `MINIO_PORT` no
`.env` — `DATABASE_URL` precisa acompanhar a mudança.

## Scripts

| Comando                 | O que faz                                                    |
| ----------------------- | ------------------------------------------------------------ |
| `pnpm dev`              | Servidor de desenvolvimento                                  |
| `pnpm build`            | Build de produção + bundle do service worker                 |
| `pnpm lint`             | ESLint, incluindo acessibilidade e fronteiras de arquitetura |
| `pnpm typecheck`        | Tipos do app e do service worker                             |
| `pnpm test`             | Testes unitários (domínio e aplicação)                       |
| `pnpm test:integration` | Testes de repositório contra PostGIS real (exige Docker)     |
| `pnpm test:e2e`         | Playwright, com verificação de acessibilidade via axe        |
| `pnpm db:generate`      | Gera migração a partir do schema Drizzle                     |
| `pnpm db:migrate`       | Aplica as migrações                                          |
| `pnpm db:seed`          | Popula o banco com artesãos fictícios de Alagoas             |
| `pnpm db:studio`        | Inspeciona o banco pelo Drizzle Studio                       |
| `pnpm icons`            | Regenera os ícones do PWA                                    |

## Arquitetura

Clean Architecture com as camadas no topo e os agregados dentro de cada uma. A regra de dependência
é imposta por lint (`eslint-plugin-boundaries`), não apenas documentada — uma violação quebra o CI.

```
src/
  app/              rotas Next (finas) e composição
  domain/           regras e tipos puros, sem dependência externa
  application/      casos de uso + ports (interfaces)
  infrastructure/   banco, storage, auth, configuração
  presentation/     componentes React reutilizáveis
```

`domain → nada`, `application → domain`, `infrastructure → application + domain`,
`presentation → application + domain`, `app → todas`. Detalhes em
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL + PostGIS · Drizzle ORM ·
Better Auth · Leaflet + OpenStreetMap · Vitest · Testcontainers · Playwright + axe.

A busca por proximidade usa `geography(Point,4326)` com índice GiST e `ST_DWithin`, com ordenação
por distância real (`<->`).

## Acessibilidade e inclusão

Parte do público-alvo tem pouca familiaridade com tecnologia e usa aparelhos de entrada em rede
ruim. Isso é requisito de projeto, não detalhe de acabamento, e aparece em decisões concretas:
mapa raster leve em vez de WebGL, fontes de sistema sem download, alvos de toque a partir de 44px,
zoom habilitado, `prefers-reduced-motion` respeitado, e verificação automática WCAG 2.2 AA no lint
e nos testes E2E.

## Licença

**Ainda não definida.** Sem um arquivo `LICENSE`, o padrão legal é "todos os direitos reservados" —
ou seja, terceiros não podem reutilizar nem replicar o experimento. A decisão precisa ser tomada
antes da submissão do artigo.

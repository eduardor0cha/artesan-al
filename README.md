# ArtesanAL

Plataforma geolocalizada para divulgação de artesãos e produtos artesanais de Alagoas.

O problema: artesãos alagoanos têm baixa visibilidade digital, e quem quer comprar artesanato não
sabe **onde** encontrá-lo fisicamente. A pergunta que o sistema responde é _"quais pontos de venda
de artesanato estão perto de mim, e quem e o que se vende lá?"_.

Este repositório é o artefato de software do artigo **"ArtesanAL: uma plataforma geolocalizada para
divulgação de artesãos e produtos artesanais"**.

> **Estado atual: MVP completo.** O ciclo inteiro está de pé — o artesão cria a conta com CPF,
> marca no GPS onde vende, publica peças com foto; o visitante abre o mapa, encontra o ponto e fala
> com quem faz. As fatias e o critério de pronto de cada uma estão em
> [`docs/mvp-plan.md`](./docs/mvp-plan.md). As decisões que guiaram a base estão em
> [`docs/adr/`](./docs/adr/), e as entrevistas integrais que as originaram em
> [`docs/adr/0000-grilling-transcript.md`](./docs/adr/0000-grilling-transcript.md).

## As telas

| Onde                      | O quê                                                                     |
| ------------------------- | ------------------------------------------------------------------------- |
| `/`                       | Busca por proximidade: lista ordenada por distância, com o mapa ao lado   |
| `/pontos-de-venda/[id]`   | O ponto no mapa, quando abre, e quem vende ali                            |
| `/artesaos/[slug]`        | A página do artesão: história, ofício, catálogo, onde encontrar, WhatsApp |
| `/produtos/[id]`          | A peça, com foto, preço, quem fez e onde comprar                          |
| `/criar-conta`, `/entrar` | Conta por CPF e senha; recuperação por código no celular                  |
| `/painel`                 | Visão geral da conta do artesão                                           |
| `/painel/perfil`          | O que o visitante lê na página dele                                       |
| `/painel/onde-vendo`      | Marcar no GPS onde vende, reaproveitando um ponto já cadastrado           |
| `/painel/produtos`        | Publicar, editar e tirar peças, com a foto reduzida no próprio aparelho   |

O estado da busca vive na URL (`/?lat=-9.7519&lng=-36.6614&raio=10`), então qualquer tela pública
é compartilhável por WhatsApp e renderiza sem JavaScript.

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

### Demonstrando o lado do artesão

O seed cria uma conta com credenciais conhecidas. Entre em <http://localhost:3000/entrar> com:

| CPF           | Senha          |
| ------------- | -------------- |
| `11144477735` | `artesanal123` |

É a conta de Maria do Barro, que já vende na Feira do Artesanato de Arapiraca e tem duas peças
publicadas — o painel abre com conteúdo em vez de vazio. As credenciais estão em
[`src/infrastructure/db/demo-account.ts`](./src/infrastructure/db/demo-account.ts), são escritas só
por `pnpm db:seed` e não servem para nenhum ambiente publicado.

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

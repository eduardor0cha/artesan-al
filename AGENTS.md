# ArtesanAL

Plataforma geolocalizada de divulgação de artesãos alagoanos, e artefato de software de um artigo.
Leia antes de escrever código:

- [`docs/mvp-plan.md`](./docs/mvp-plan.md) — as fatias do MVP, em ordem, com o critério de pronto de
  cada uma. Trabalhe uma fatia por vez e marque o progresso no fim do arquivo.
- [`docs/adr/`](./docs/adr/) — as decisões e o porquê delas. Se for contrariar uma, escreva outra
  ADR em vez de mudar a existente.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — regra de dependência entre camadas, convenções e a
  bateria de verificação antes de um PR.

## O que morde quem chega agora

- **A regra de dependência é imposta por lint**, não por convenção: `domain` não importa nada,
  nem zod; `application` fala com o mundo só pelos ports; `presentation` nunca toca
  `infrastructure`; só `app/` alcança todas. Violar quebra o CI.
- **Escrita por Server Action, leitura por Server Component**, sem camada de API — exceto o handler
  do Better Auth em `/api/auth/[...all]` (ADR 0009). Toda ação reconfere a sessão.
- **Código em inglês, URL pública em pt-BR** (`/artesaos/[slug]`), texto de interface em pt-BR e
  centralizado em `src/presentation/messages/pt-BR.ts` — nenhuma string solta em componente.
- **Acessibilidade é asserção de teste**, não acabamento: o axe roda no E2E e uma violação falha o
  build. Alvo de toque a partir de 44px, sem webfont, zoom habilitado.
- **Não existe CLI do shadcn aqui** (sem `components.json`). Componente novo se escreve à mão no
  estilo de `src/presentation/components/ui/button.tsx`.
- **Nunca edite uma migração já aplicada** — gere outra. A coluna geográfica usa o domínio
  `geography_point`; o motivo está em `src/infrastructure/db/schema/geography.ts`.
- **CPF é dado sob a LGPD**: nunca em página pública, URL ou log.
- Testes primeiro no domínio e nos casos de uso; consulta espacial nova nasce com teste de
  integração contra PostGIS real (exige Docker).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

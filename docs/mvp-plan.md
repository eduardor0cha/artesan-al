# Plano do MVP

Este arquivo divide a construção do MVP em fatias verticais. Cada fatia atravessa todas as camadas
— domínio, caso de uso, repositório e tela — e termina com algo que dá para abrir no navegador e
demonstrar. A ordem foi escolhida para derrubar cedo o risco registrado na decisão 21 da
[transcrição](./adr/0000-grilling-transcript.md): a fiação Drizzle ↔ PostGIS ↔ tipagem só se prova
quando alguma coisa atravessa de ponta a ponta.

O escopo e as decisões abaixo vêm da segunda rodada de entrevista, registrada no fim da
transcrição e nas ADRs [0009](./adr/0009-server-actions.md), [0010](./adr/0010-urls-em-pt-br.md) e
[0011](./adr/0011-divulgacao-nao-marketplace.md).

## O que o MVP entrega

O ciclo completo: o artesão cria sua conta com CPF, cadastra onde vende marcando o GPS no local,
publica peças com foto — e o visitante, do outro lado, abre o app, informa onde está e encontra
aquele ponto de venda no mapa, com a página do artesão, o catálogo e um botão para chamar no
WhatsApp.

## O que fica de fora, de propósito

| Fora do MVP                               | Por quê                                                             |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Denúncia e painel de moderação            | A ADR 0004 prevê, mas é a parte menos citável; entra depois do MVP  |
| Agrupamento de marcadores (markercluster) | Quatro pontos no seed não agrupam nada; a dependência nem instalada |
| Provedor real de SMS/WhatsApp para OTP    | Sem verba; o código continua saindo no log do servidor              |
| Mais de uma foto por produto              | `product_images.position` já suporta, mas a tela custa caro         |
| Busca textual e seletor de município      | A busca do MVP é sempre centro geográfico + raio                    |
| Carrinho, pedido, pagamento               | Outro trabalho: este sistema divulga, não vende (ADR 0011)          |
| Hospedagem, licença, Storybook            | Pendências já declaradas em aberto na transcrição                   |

## Convenções que valem para todas as fatias

- **Escrita por Server Action; leitura por Server Component.** Não existe camada de API no MVP,
  com uma exceção obrigatória: o Better Auth monta o próprio handler em `/api/auth/[...all]`.
- **Ação é adaptador fino.** Ela valida a entrada com zod, chama o caso de uso e traduz o
  `Result` em mensagem de tela. Regra de negócio nenhuma mora ali.
- **URL pública em pt-BR** (`/artesaos/[slug]`), código em inglês.
- **Teste antes no domínio e no caso de uso**; consulta nova nasce com teste de integração; cada
  fatia fecha com um E2E do fluxo e a asserção do axe.
- **Nenhuma string solta em componente** — tudo em `src/presentation/messages/pt-BR.ts`.
- **Componentes de UI** são escritos à mão no estilo de `presentation/components/ui/button.tsx`
  (Radix quando houver comportamento, `cva` para variantes). Não há `components.json`, então não
  existe CLI do shadcn neste repositório.
- Ao fechar a fatia: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`, mais
  `test:integration` e `test:e2e` quando a fatia mexeu em banco ou tela, e um commit convencional.

---

## Fatia 1 — Busca por proximidade

**Objetivo:** o visitante abre `/`, informa onde está e vê os pontos de venda próximos, ordenados
por distância, em lista renderizada no servidor, com o mapa ao lado.

O centro e o raio vivem na URL (`/?lat=-9.75&lng=-36.66&raio=10`). Isso faz a página ser
renderizável no servidor, compartilhável, e testável no Playwright sem simular GPS. Sem parâmetro,
o centro é Maceió, e o visitante tem duas saídas: o botão "Usar minha localização" ou arrastar o
mapa e tocar em "Buscar nesta área".

**Nasce:**

- `application/sales-point/search-nearby-sales-points.ts` — caso de uso, com teste unitário sobre
  um repositório falso.
- `application/ports/sales-point-search.query.ts` — read model próprio da busca:
  `NearbySalesPointSummary` carrega o ponto, a distância, até três nomes de artesãos e a contagem
  total. Port separado de propósito: `SalesPointRepository.findNearby` também serve à checagem de
  duplicata da fatia 4 e não deve inchar.
- `infrastructure/db/queries/sales-point-search.query.ts` — `ST_DWithin` com junção lateral em
  `artisan_sales_points`, mais teste de integração.
- `app/page.tsx` reescrita, lendo `searchParams`.
- `presentation/components/search/` — `SalesPointCard`, `RadiusFilter`, `UseMyLocationButton`
  (cliente), `NearbySalesPointsMap` (cliente, importado dinamicamente com `ssr: false`).
- Ajuste no CI: o job de E2E hoje não sobe banco nenhum e só passa porque a home não consulta
  nada. A partir desta fatia ele precisa de serviço PostGIS, `db:migrate` e `db:seed`.

**Pronto quando:** `/?lat=-9.7519&lng=-36.6614&raio=10` lista a Feira do Artesanato de Arapiraca
com a distância e o nome de Maria do Barro; a lista aparece com o JavaScript desativado; o axe
passa nos dois dispositivos do Playwright.

---

## Fatia 2 — Páginas públicas

**Objetivo:** as quatro páginas que o visitante alcança a partir da busca, todas indexáveis e com
Open Graph próprio — o link precisa ficar apresentável quando alguém o cola no WhatsApp.

| Rota                    | Conteúdo                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| `/pontos-de-venda/[id]` | Nome, tipo, endereço, horário, mapa do ponto, quem vende ali         |
| `/artesaos/[slug]`      | Nome, história, ofício, cidade, SICAB, catálogo, onde vende, contato |
| `/produtos/[id]`        | Foto, nome, preço, descrição, quem fez, onde comprar, contato        |

**Nasce:**

- `infrastructure/db/repositories/artisan.repository.ts` e `product.repository.ts`, implementando
  os ports que já existem, com testes de integração.
- Métodos que faltam nos ports: `ArtisanRepository.findBySlug` e a leitura de quais artesãos
  vendem num ponto.
- Casos de uso de leitura das três páginas.
- `presentation/components/` — `ProductCard`, `WhatsAppButton`, `ArtisanSummary`.
- `generateMetadata` em cada rota.

**Pronto quando:** dá para sair da busca, abrir o ponto, chegar ao artesão, abrir a peça e tocar em
"Falar no WhatsApp" com a mensagem já escrita citando a peça; axe passa nas três rotas.

---

## Fatia 3 — Conta do artesão

**Objetivo:** criar conta com CPF e senha, entrar, sair e recuperar a senha por código no celular.

**Nasce:**

- `app/api/auth/[...all]/route.ts` — handler do Better Auth (a única rota de API do MVP).
- `infrastructure/auth/session.ts` — leitura da sessão em Server Component, e o redirecionamento
  de quem não está autenticado.
- `domain/artisan/slug.ts` e `domain/artisan/phone.ts` — value objects com teste. O slug nasce do
  nome e precisa ser único; o telefone valida celular brasileiro com DDD.
- ~~Migração `0002`: coluna opcional `sicab_number` em `artisans`~~ e ~~alinhar o tipo `Artisan` do
  domínio com o schema~~ — os dois vieram na fatia 2, que precisava deles para montar a página
  pública do artesão sem carregar o CPF junto.
- Casos de uso `sign-up-artisan` (cria o usuário no Better Auth com `username` = CPF, e-mail
  sintético `<cpf>@local.artesanal`, telefone de recuperação, e a linha em `artisans`) e
  `request-password-otp`.
- Ações e telas: `/criar-conta`, `/entrar`, `/esqueci-minha-senha`, `/painel`.

**Pronto quando:** um CPF novo cria conta e cai no primeiro passo guiado; um CPF já cadastrado é
recusado com mensagem clara; `/painel` redireciona quem não entrou; o CPF não aparece em nenhuma
página pública, URL ou log.

---

## Fatia 4 — Onde eu vendo

**Objetivo:** o artesão marca no local, pelo GPS do celular, onde vende — reaproveitando um ponto
existente sempre que houver um por perto.

O fluxo é o da ADR 0004: primeiro o app mostra os pontos já cadastrados num raio curto, com a
distância; só quem não encontrar o seu abre o formulário de ponto novo.

**Nasce:**

- Casos de uso `find-nearby-sales-points-to-reuse` (mesma consulta da busca pública, com raio
  curto), `register-sales-point` e `link-artisan-to-sales-point`.
- Métodos de vínculo no `SalesPointRepository` ou port próprio para `artisan_sales_points`,
  respeitando a vigência (`endsOn` nulo é vínculo atual).
- Telas `/painel/onde-vendo` e `/painel/onde-vendo/novo`, com mapa de pin arrastável e o botão de
  usar a localização atual.

**Pronto quando:** o artesão marca um ponto a 50 m de uma feira já cadastrada e o app oferece
aquela feira antes de deixar criar outra; o ponto novo aparece na busca pública do visitante.

---

## Fatia 5 — Catálogo

**Objetivo:** publicar, editar e remover peças, com uma foto cada.

A foto é reduzida para cerca de 1200 px no próprio navegador, com `canvas`, antes de subir — sem
dependência nova e sem upload de vários megabytes em rede ruim. O texto alternativo é obrigatório,
como o schema já exige, e o campo vem com exemplo de preenchimento.

**Nasce:**

- Casos de uso `publish-product`, `update-product`, `remove-product`, falando com `ImageStorage`.
- `presentation/components/product/PhotoInput.tsx` — captura, redução e pré-visualização.
- Telas `/painel/produtos`, `/painel/produtos/nova-peca` e `/painel/produtos/[id]` — a edição
  precisa de tela própria, e a remoção mora nela atrás de uma confirmação.
- Teste de integração do `S3ImageStorage` contra um MinIO de Testcontainers.

**Pronto quando:** uma peça publicada pelo painel aparece na página pública do artesão e na página
própria, com a foto servida pelo MinIO e o texto alternativo lido pelo axe.

---

## Fatia 6 — Acabamento

**Objetivo:** fechar as pontas que o ciclo completo deixou e deixar o artefato apresentável para a
avaliação e para as capturas do artigo.

- Edição do perfil: história, ofício, cidade, telefone público, SICAB.
- Painel com visão geral — onde vende, quantas peças, link para o próprio perfil público.
- Uma conta de demonstração no seed, com CPF e senha conhecidos, para a avaliação e para o E2E.
- Cache do service worker cobrindo as telas públicas, com a página offline já existente.
- Varredura de acessibilidade em todas as rotas e revisão do vocabulário de `pt-BR.ts` como um
  todo — frases curtas, sem jargão.
- README atualizado: sai o aviso de "andaime", entram as telas e como demonstrá-las.

---

## Registro de progresso

- [x] Fatia 1 — Busca por proximidade
- [x] Fatia 2 — Páginas públicas
- [x] Fatia 3 — Conta do artesão
- [x] Fatia 4 — Onde eu vendo
- [x] Fatia 5 — Catálogo
- [ ] Fatia 6 — Acabamento

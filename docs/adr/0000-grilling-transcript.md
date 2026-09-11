# Transcrição do grilling — ArtesanAL

Registro das decisões de projeto, na ordem em que foram tomadas, durante a entrevista de
concepção do repositório que servirá de artefato para o artigo **"ArtesanAL: uma plataforma
geolocalizada para divulgação de artesãos e produtos artesanais"**.

---

## 1. Horizonte do projeto

**Pergunta:** Qual é o horizonte real do ArtesanAL enquanto artefato do artigo?

**Alternativas:** MVP publicado em produção · Protótipo funcional (demo local) · Base para evolução de longo prazo

**Resposta:** _"Este artigo será de curto prazo e teremos ajuda de IA. A equipe será apenas de duas pessoas. Mas se as melhores práticas forem estabelecer uma boa base para evolução de longo prazo, pode ser."_

---

## 2. Plataforma-alvo

**Pergunta:** Onde o ArtesanAL vai rodar para o consumidor que busca artesãos por perto?

**Alternativas:** Web responsiva + PWA · Web + app React Native/Expo · Só mobile (Expo)

**Resposta:** **Web responsiva + PWA**

---

## 3. Separação frontend/backend

**Pergunta:** Como separar frontend e backend?

**Alternativas:** Next.js full-stack (1 app) · Next.js + NestJS separados · Vite SPA + Fastify · Django/GeoDjango

**Resposta:** **Next.js full-stack, 1 app**

---

## 4. Estratégia de proximidade

**Pergunta:** Como modelar e consultar "artesãos num raio de X km de mim"?

**Alternativas:** PostgreSQL + PostGIS · PostgreSQL puro (Haversine) · earthdistance/cube

**Resposta:** **PostgreSQL + PostGIS**

---

## 5. Esclarecimento sobre o papel da geolocalização

**Intervenção:** _"Só para deixar claro, a localização servirá para o usuário saber quais são os pontos de venda de artesanato mais próximos."_

---

## 6. Camada de acesso a dados

**Pergunta:** Qual ORM usar com PostGIS?

**Alternativas:** Drizzle · Prisma · SQL puro (node-postgres)

**Resposta:** **Drizzle ORM**

---

## 7. Modelo de domínio

**Pergunta:** Qual desenho de entidades representa melhor a realidade dos artesãos alagoanos?

**Alternativas:** Artesão ↔ PontoDeVenda N:N · Artesão com um endereço próprio · PontoDeVenda como entidade central

**Resposta:** **Artesão ↔ PontoDeVenda N:N**

---

## 8. Curadoria do conteúdo

**Pergunta:** Quem cadastra artesãos, produtos e pontos de venda?

**Alternativas:** Self-service + moderação · Só a equipe · Self-service sem moderação

**Resposta:** **Os próprios artesãos se cadastram.**

> Resposta revisada. A primeira resposta havia sido _"Imagino que o cadastro do ponto de venda/artesão
> seria curado pelo governo do estado. Porém a moderação do catálogo é por conta do artesão."_ — a
> curadoria estatal foi descartada, e as decisões 12, 13 e 15, que dependiam dela, foram revistas.

---

## 8.1. Moderação

**Pergunta:** Sem o órgão estadual curando o cadastro, ainda existe algum papel de moderação?

**Alternativas:** Admin aprova antes de publicar · Moderação só reativa · Sem moderação nenhuma

**Resposta:** **Moderação só reativa** — tudo publica na hora, e o admin (a própria equipe de pesquisa) age mediante denúncia ou revisão posterior

---

## 8.2. Criação de pontos de venda

**Pergunta:** Quem cria o ponto de venda, e o que acontece quando dois artesãos vendem na mesma feira?

**Alternativas:** Artesão cria, com busca por pontos próximos antes · Artesão cria livremente, deduplicação depois · Pontos coletivos pré-cadastrados pela equipe

**Resposta:** **O artesão cria, mas o app primeiro oferece os pontos já existentes num raio curto** e só permite criar um novo se nenhum servir

---

## 8.3. Recuperação de senha

**Pergunta:** Qual o canal de recuperação de senha no autocadastro?

**Alternativas:** Telefone obrigatório + OTP · E-mail obrigatório · Código de recuperação anotado · Sem autorrecuperação

**Resposta:** **Telefone obrigatório + OTP** (em desenvolvimento o código sai no log; provedor de SMS/WhatsApp entra depois por variável de ambiente). E-mail permanece opcional

---

## 9. Infraestrutura

**Pergunta:** Onde o sistema vai rodar (banco com PostGIS, fotos e app)?

**Alternativas:** Vercel + Supabase · Vercel + Neon + R2 · VPS com Docker · Só local

**Resposta:** **Só local, por enquanto**

---

## 10. Biblioteca de autenticação

**Pergunta:** Qual biblioteca de autenticação, self-hosted junto do app?

**Alternativas:** Better Auth · Auth.js (NextAuth v5) · Autenticação própria

**Resposta:** **Better Auth**

---

## 11. Intervenção sobre inclusão digital

**Intervenção:** _"O intuito do app é ser inclusivo para os artesãos (há pessoas que não têm familiaridade com a tecnologia)."_

---

## 12. Forma de login do artesão

**Pergunta:** Como o artesão entra na plataforma, dado o público com pouca familiaridade digital?

**Alternativas:** Telefone + senha (conta criada pelo curador) · Magic link · Entrar com Google · E-mail + senha

**Resposta:** _"É bom usar (telefone ou cpf) + senha?"_

> Afetada pela revisão da decisão 8: a alternativa de conta criada pelo curador deixou de existir.
> O artesão cria a própria conta, e a recuperação segue a decisão 8.3.

**Ressalva levantada:** CPF e celular com DDD têm ambos 11 dígitos. Aceitar os dois no mesmo campo obriga a desambiguar por dígito verificador — um celular que por acaso passe na validação de CPF vira bug silencioso de autenticação.

---

## 13. Identificador único

**Pergunta:** Qual será o identificador único de login do artesão?

**Alternativas:** CPF + senha · Telefone + senha · Ambos no mesmo campo

**Resposta:** **CPF + senha**

---

## 14. Mapa e tiles

**Pergunta:** Qual biblioteca de mapa e fonte de tiles?

**Alternativas:** Leaflet + OpenStreetMap · MapLibre GL + tiles vetoriais · Google Maps · Sem mapa

**Resposta:** **Leaflet + tiles OpenStreetMap**

---

## 15. Origem das coordenadas

**Pergunta:** Como o ponto de venda ganha suas coordenadas?

**Alternativas:** GPS em campo + ajuste do pin · Geocodificação por endereço (Nominatim) · CEP via ViaCEP + pin manual

**Resposta:** **GPS em campo + ajuste manual do pin**

> Afetada pela revisão da decisão 8: quem marca o GPS é o próprio artesão, no local onde vende,
> e não mais um curador em visita de campo.

---

## 16. Estilização e componentes

**Pergunta:** Como estilizar a interface, dado que acessibilidade AA é requisito?

**Alternativas:** Tailwind + shadcn/ui · Mantine · CSS Modules puro

**Resposta:** **Tailwind CSS + shadcn/ui**

---

## 17. Estrutura de pastas

**Pergunta:** Qual organização dentro de `src/`?

**Alternativas:** Feature-first com camadas por módulo · Camadas globais (Clean Architecture) · Padrão Next.js simples

**Resposta:** **Camadas globais (Clean Architecture)**

---

## 18. Subdivisão dentro das camadas

**Pergunta:** Dentro de cada camada, como subdividir?

**Alternativas:** Camadas > agregados · Camadas planas (por tipo de arquivo)

**Resposta:** Pedido de explicação, seguido de **"Sim, fechado"**, com a regra de dependência imposta por `eslint-plugin-boundaries`

---

## 19. Estratégia de testes

**Pergunta:** Qual estratégia, considerando prazo curto e 2 pessoas?

**Alternativas:** Pirâmide enxuta em 3 níveis · Só unitários · Só E2E · TDD estrito

**Resposta:** **Pirâmide enxuta em 3 níveis** (Vitest · Testcontainers · Playwright + axe)

---

## 20. Tooling

**Consequências declaradas sem gastar pergunta:** ESLint + Prettier em vez de Biome, e pnpm como gerenciador de pacotes.

**Pergunta:** Quais itens entram já no commit inicial?

**Alternativas:** Husky + lint-staged · commitlint · CI no GitHub Actions · Storybook

**Resposta:** **Husky + lint-staged**, **commits convencionais + commitlint** e **CI no GitHub Actions**. Storybook ficou de fora.

---

## 21. Escopo do bootstrap

**Pergunta:** O que estará pronto ao fim deste trabalho?

**Alternativas:** Esqueleto ambulante com 1 fatia vertical · Só andaimes · Esqueleto + CRUD

**Resposta:** **Só andaimes, sem funcionalidade**

**Ressalva registrada:** sem nada atravessando as camadas, o risco de a fiação Drizzle↔PostGIS↔tipagem só revelar problema na primeira feature permanece.

---

## 22. Conteúdo dos andaimes

**Pergunta:** O que mais entra nos andaimes?

**Alternativas:** Smoke test PostGIS + schema · Seed com dados de Alagoas · Docs de reprodutibilidade · PWA configurado

**Resposta:** **Todos os quatro**

---

## 23. Língua do código

**Pergunta:** Em que língua nomear tipos, funções, tabelas e rotas?

**Alternativas:** Domínio em pt-BR + resto em inglês · Tudo em inglês · Tudo em pt-BR

**Resposta:** **Tudo em inglês** (strings de UI seguem em pt-BR, centralizadas)

---

## 24. Licença

**Pergunta:** Qual licença para o repositório?

**Alternativas:** MIT · AGPL-3.0 · Apache-2.0 · Sem licença por enquanto

**Resposta:** **Sem licença por enquanto**

---

## Pontos deliberadamente em aberto

| Pendência                             | Quando decidir                             |
| ------------------------------------- | ------------------------------------------ |
| Licença                               | Antes da submissão do artigo               |
| Hospedagem                            | Quando houver avaliação com artesãos reais |
| Recuperação de senha por OTP/WhatsApp | Quando houver verba para provedor de SMS   |
| Storybook                             | Depois que existirem telas                 |

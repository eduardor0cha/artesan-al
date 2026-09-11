# 0001 — Web PWA com Next.js full-stack

**Status:** aceita

## Contexto

Equipe de duas pessoas, prazo curto, com a base precisando sobreviver a bolsistas e TCCs futuros.
O público consumidor busca artesanato pelo celular, e as páginas de artesãos e produtos precisam
ser indexáveis, já que "divulgação" é a função central do sistema.

## Decisão

Aplicação web responsiva instalável como PWA, em uma única base de código Next.js (App Router) com
TypeScript ponta a ponta. As rotas de API são Route Handlers do próprio Next.

## Alternativas descartadas

- **App nativo (React Native/Expo)**, junto ou no lugar da web: dobraria o esforço de construção e
  publicação, e dificultaria a demonstração e a avaliação com usuários.
- **Front SPA + API separada (Fastify/NestJS)**: separação mais fácil de desenhar no artigo, mas
  custa dois deploys, CORS e contratos duplicados; a SPA ainda perderia SEO.

## Consequências

- Um deploy, um lint, um runner de teste.
- Um app nativo continua possível depois, porque a camada de API já é HTTP.
- Ficamos presos às escolhas do Next (Turbopack por padrão em 16), o que já cobrou seu preço na
  integração do service worker — ver ADR 0008.

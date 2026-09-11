# 0003 — Artesão ↔ ponto de venda N:N, com a geolocalização no ponto

**Status:** aceita

## Contexto

A intuição inicial era geolocalizar o artesão. O esclarecimento do domínio mudou isso: o que o
visitante precisa saber é **onde comprar** — e, em Alagoas, o caso mais comum é a feira coletiva,
com dezenas de artesãos no mesmo lugar, além do artesão itinerante que vende em vários pontos.

## Decisão

`Artisan ─< Product` e `Artisan >─< SalesPoint`, com tabela de ligação que guarda vigência. A
coluna geográfica vive em `SalesPoint`, nunca no artesão. O ateliê do próprio artesão é apenas um
ponto de venda do tipo `workshop`.

## Alternativas descartadas

- **Endereço único no artesão**: menos tabelas e telas, mas quebra na feira coletiva e obriga a
  duplicar o artesão para cada lugar onde vende.
- **Ponto de venda como entidade central**, com artesãos como conteúdo dele: bom para um mapa de
  feiras, mas enfraquece a página própria do artesão, que é o que dá título ao artigo.

## Consequências

- Uma feira é criada uma vez e reaproveitada; por isso o cadastro oferece os pontos próximos antes
  de permitir criar um novo (ver ADR 0004).
- A vigência na tabela de ligação preserva o histórico de onde um artesão vendeu ao longo do ano.

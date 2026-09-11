# 0010 — URLs públicas em pt-BR, código em inglês

**Status:** aceita (esclarece a ADR/decisão 23)

## Contexto

A decisão 23 da transcrição fixou "tudo em inglês" para tipos, funções, tabelas e rotas, com as
strings de interface em pt-BR. O `CONTRIBUTING.md` registrou isso com o exemplo `/sales-points`.
Só que o comentário de `artisans.slug` no schema já previa `/artesaos/maria-do-barro` — as duas
convenções não podiam coexistir.

## Decisão

**URL pública em pt-BR**, código em inglês. A rota é `/artesaos/[slug]`, `/pontos-de-venda/[id]`,
`/produtos/[id]`, `/entrar`, `/criar-conta`, `/painel`; o tipo continua `SalesPoint`, a tabela
continua `sales_points`, o componente continua `SalesPointCard`.

## Alternativas descartadas

- **Rotas em inglês**, como o CONTRIBUTING dizia: mantém uma única língua da pasta ao banco, mas
  expõe vocabulário estrangeiro a um público escolhido justamente por ter pouca familiaridade
  digital, e joga fora a palavra-chave em português na URL indexada.
- **Público em pt-BR e painel em inglês**: preservaria o SEO onde importa, ao custo de duas
  convenções de rota no mesmo aplicativo e mais uma regra a explicar.

## Consequências

- A URL é conteúdo, não código: é lida por quem recebe o link no WhatsApp e indexada em português,
  que é a língua de quem procura artesanato alagoano.
- O `CONTRIBUTING.md` foi corrigido: a regra "rotas em inglês" virou "rotas públicas em pt-BR".
- Nomes de pasta em `src/app/` deixam de coincidir com os nomes dos agregados. O elo é o nome do
  componente e do caso de uso que a rota compõe, não o caminho.

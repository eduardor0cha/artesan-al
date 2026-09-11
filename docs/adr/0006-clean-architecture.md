# 0006 — Clean Architecture com fronteiras impostas por lint

**Status:** aceita

## Contexto

A base precisa sobreviver a bolsistas e TCCs futuros e ser navegável por ferramentas de IA, sem
que o prazo curto vire desculpa para regra de negócio espalhada por componentes.

## Decisão

Camadas no topo (`domain`, `application`, `infrastructure`, `presentation`, mais `app` para as
rotas, que o Next obriga a ficar em `src/app`), com agregados dentro de cada camada. A regra de
dependência é imposta por `eslint-plugin-boundaries`.

## Alternativas descartadas

- **Feature-first** (`modules/sales-point/{domain,application,...}`): menos atrito diário, mas o
  vocabulário canônico de camadas é mais fácil de citar e desenhar no artigo.
- **Camadas planas por tipo de arquivo** (`domain/entities/`, `application/usecases/`): mais
  ortodoxo, mas cada pasta vira lista longa sem agrupamento semântico.
- **Convenção documentada sem lint**: menos configuração, mas a regra é violada aos poucos.

## Consequências

- `app/` é a raiz de composição e a única camada autorizada a alcançar `infrastructure`.
- `domain` não pode importar **nenhuma** biblioteca externa, o que mantém os testes unitários
  rápidos e sem mock.
- Uma violação quebra o CI em vez de virar dívida silenciosa. Para conferir que a barreira está
  viva, basta introduzir um import proibido e rodar `pnpm lint`.

# 0012 — Registro SICAB opcional, sem selo de verificado

**Status:** aceita (fecha uma pendência da ADR 0004)

## Contexto

A ADR 0004 trocou a curadoria estatal pelo autocadastro e deixou explícito o que isso abriu: sem
curador, ninguém atesta que quem se cadastrou é de fato artesão. A própria ADR apontou o caminho
barato — um campo opcional de registro SICAB — e o deixou como decisão de produto.

## Decisão

Campo opcional `sicab_number` no perfil do artesão, exibido como informação na página pública.
**Sem selo de "artesão verificado".**

## Alternativas descartadas

- **Nada no MVP**: deixaria o cadastro mais curto, mas adiar o campo custa migração e mais uma
  passagem pelo formulário quando a verificação entrar.
- **SICAB com selo de verificado**: comunicaria confiança ao visitante, mas nada no sistema confere
  o número contra o cadastro nacional. O selo afirmaria algo que o sistema não sabe — e um selo que
  ninguém confere é pior do que selo nenhum.

## Consequências

- O dado passa a ser coletado desde o início, então a verificação real, se vier, encontra base.
- A confiança do visitante continua apoiada na moderação reativa e no contato direto com o artesão,
  não num atestado da plataforma.
- Como identificador civil ligado a uma pessoa, o número segue a mesma regra do CPF na LGPD para
  registro e log, ainda que, ao contrário do CPF, seja exibido por escolha do próprio artesão.

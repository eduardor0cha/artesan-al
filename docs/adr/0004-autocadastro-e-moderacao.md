# 0004 — Autocadastro do artesão com moderação reativa

**Status:** aceita (revisa uma decisão anterior)

## Contexto

A primeira versão desta decisão previa curadoria pelo governo do estado: o órgão validaria quem é
artesão e onde ficam os pontos de venda, e o artesão cuidaria apenas do catálogo. Essa premissa foi
descartada em favor do autocadastro.

## Decisão

O próprio artesão cria sua conta, seus pontos de venda e seu catálogo. A publicação é imediata, e a
moderação é **reativa**: conteúdo é revisado quando denunciado. O papel `admin` permanece, exercido
pela equipe de pesquisa, com poderes de revisão e banimento.

Ao cadastrar onde vende, o artesão primeiro recebe a lista de pontos já existentes num raio curto e
só pode criar um novo se nenhum servir.

## Alternativas descartadas

- **Aprovação prévia por admin**: protege melhor contra spam, mas faz o artesão esperar para ver o
  próprio perfil no ar — e a recompensa imediata importa para quem tem pouca familiaridade digital
  e pode desistir no meio.
- **Sem moderação alguma**: menos código, mas nenhuma defesa durante o período de avaliação pública.

## Consequências

- Tabela `reports` como fila de moderação. `target_id` não é chave estrangeira de propósito: o
  registro da denúncia precisa sobreviver à remoção do conteúdo denunciado.
- Sem curador, não há quem resete senha nem quem ateste que alguém é de fato artesão. A primeira
  lacuna é resolvida pelo OTP (ADR 0005); a segunda fica em aberto — um campo opcional de registro
  SICAB com selo de "artesão verificado" é o caminho barato, mas é decisão de produto.
- A busca por duplicatas reaproveita a mesma consulta `ST_DWithin` da busca pública.

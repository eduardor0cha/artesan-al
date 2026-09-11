# 0002 — PostgreSQL + PostGIS com Drizzle ORM

**Status:** aceita

## Contexto

A contribuição técnica do trabalho é a busca por proximidade: "quais pontos de venda estão num raio
de X km de mim". Isso precisa de distância geodésica correta e de índice espacial, não de uma
fórmula de Haversine escrita à mão.

## Decisão

PostgreSQL com PostGIS, coluna `geography(Point,4326)`, índice GiST e consultas `ST_DWithin` com
ordenação por `<->`. O acesso a dados é feito com Drizzle ORM, com migrações `.sql` versionadas.

## Alternativas descartadas

- **Postgres puro com Haversine**: sem dependência de extensão, mas reimplementa à mão o que o
  PostGIS já faz e é mais frágil de justificar academicamente.
- **Prisma**: melhor DX e mais material de referência, mas PostGIS exigiria `Unsupported` no schema
  e `$queryRaw` sem tipagem para toda consulta de proximidade — a parte central do projeto ficaria
  fora do ORM.

## Consequências

- O Drizzle não traz tipo `geography`, então ele é declarado como `customType`. Como o drizzle-kit
  escreve tipos desconhecidos como identificador entre aspas, e `"geography(Point,4326)"` não é SQL
  válido, a coluna aponta para o **domínio** `geography_point`, criado na migração `0000`.
- Consultas espaciais são SQL cru dentro do repositório; o resto do acesso a dados usa o query
  builder.
- Os testes de integração exigem Docker, o que torna o CI mais lento — aceito, porque mockar
  `ST_DWithin` seria testar nada.

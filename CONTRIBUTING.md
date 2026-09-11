# Contribuindo com o ArtesanAL

## Regra de dependência

O projeto segue Clean Architecture com as camadas no topo e os agregados dentro de cada camada.
A regra é imposta por `eslint-plugin-boundaries`: violar quebra o lint e o CI.

| Camada            | Pode importar                                | Nunca importa                                                     |
| ----------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `domain/`         | apenas `domain/`                             | qualquer biblioteca externa, inclusive zod e Drizzle              |
| `application/`    | `domain/`, `application/`                    | `next`, `react`, `drizzle-orm` — só fala com o mundo por `ports/` |
| `infrastructure/` | `domain/`, `application/`, `infrastructure/` | `presentation/`                                                   |
| `presentation/`   | `domain/`, `application/`, `presentation/`   | `infrastructure/`                                                 |
| `app/`            | todas                                        | — é a raiz de composição                                          |

Para conferir que a barreira está viva, adicione de propósito um import de `infrastructure` dentro
de `domain` e rode `pnpm lint`: deve falhar com `boundaries/dependencies`.

## Convenções de código

- **Código em inglês**: tipos, funções, tabelas, colunas e componentes (`Artisan`, `SalesPoint`,
  `sales_points`, `SalesPointCard`).
- **URL pública em pt-BR**: `/artesaos/[slug]`, `/pontos-de-venda/[id]`, `/entrar`. A URL é lida e
  compartilhada pelo visitante, então é conteúdo, não código — ver ADR 0010.
- **Texto de interface em pt-BR**, centralizado em `src/presentation/messages/pt-BR.ts`. Nada de
  string solta em componente.
- **Comentários em inglês**, e só onde acrescentam o que o código não diz: regra de negócio,
  trade-off, contorno de limitação de biblioteca.
- **Value objects** são classes com construtor privado e `create` retornando `Result`;
  **entidades** são tipos `readonly`. Erros de domínio são retornados, nunca lançados.

## Como as telas falam com o servidor

Escrita por **Server Action**, leitura por **Server Component**. Não existe camada de API, com uma
exceção: o Better Auth monta o próprio handler em `/api/auth/[...all]` (ADR 0009).

A ação vive em `app/`, valida a entrada com zod, chama o caso de uso e traduz o `Result` em
mensagem de tela — regra de negócio nenhuma mora ali. Como uma ação é chamável por POST direto, ela
**sempre** reconfere a sessão: a tela que a contém não é barreira de autorização.

O estado de uma busca vai na URL (`/?lat=&lng=&raio=`), não em estado de componente, para a página
continuar renderizável no servidor e compartilhável.

## Testes

| Nível                       | Onde                           | Quando escrever                                           |
| --------------------------- | ------------------------------ | --------------------------------------------------------- |
| Unitário (Vitest)           | `src/**/*.test.ts`             | Toda regra de domínio e todo caso de uso                  |
| Integração (Testcontainers) | `src/**/*.integration.test.ts` | Tudo que toca SQL, sobretudo consulta espacial            |
| E2E (Playwright + axe)      | `e2e/*.spec.ts`                | Fluxos críticos; acessibilidade é asserção, não relatório |

Os testes de integração rodam as migrações reais, então também servem de verificação de que elas
aplicam do zero.

## Banco de dados

Schema em `src/infrastructure/db/schema/`, migrações geradas com `pnpm db:generate` e versionadas
como `.sql`. **Nunca edite uma migração já aplicada** — gere outra.

A coluna geográfica usa o domínio `geography_point`, criado na migração `0000`. O motivo está em
`src/infrastructure/db/schema/geography.ts`: o drizzle-kit escreve tipos desconhecidos como
identificador entre aspas, e `"geography(Point,4326)"` não é SQL válido.

## Commits

Commits convencionais, validados por `commitlint` no hook `commit-msg`:

```
feat(sales-point): busca por raio a partir da localização do visitante
fix(auth): aceita CPF com pontuação no login
chore(ci): roda testes de integração em job separado
```

Os hooks do Husky são instalados por `pnpm install` (script `prepare`) e exigem um repositório git
já inicializado.

## Antes de abrir um PR

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
pnpm test:integration   # se mexeu em banco ou consulta
pnpm test:e2e           # se mexeu em interface
```

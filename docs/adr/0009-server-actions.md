# 0009 — Server Actions para escrita, sem camada de API

**Status:** aceita (revisa parte da ADR 0001)

## Contexto

A ADR 0001 declarou que "as rotas de API são Route Handlers do próprio Next", antes de existir
qualquer tela. Ao planejar o MVP, a pergunta voltou com peso diferente: o dispositivo de referência
é um Android mediano em rede ruim, e um formulário que só funciona depois que o JavaScript carrega
é um formulário que falha exatamente para o público que o sistema quer incluir.

## Decisão

Escrita por **Server Actions**; leitura por **Server Components**, com o estado da busca na URL.
Não existe camada de API no MVP.

A exceção é obrigatória e única: o Better Auth monta o próprio handler em `/api/auth/[...all]`.

A ação é um adaptador fino — valida a entrada com zod, chama o caso de uso, traduz o `Result` em
mensagem de tela. Ela pertence à camada `app/`, que é a raiz de composição, e não contém regra de
negócio.

## Alternativas descartadas

- **Route Handlers + fetch no cliente**, como a ADR 0001 previa: deixaria a API HTTP pronta para um
  app nativo futuro, mas exige JavaScript carregado em todo formulário e transforma carregamento,
  erro e revalidação em código escrito à mão em cada tela.
- **Server Actions no painel e Route Handlers na busca**: cobriria os dois casos, mas manteria duas
  formas de falar com o servidor e duas formas de tratar erro numa base que precisa sobreviver a
  bolsistas e TCCs.

## Consequências

- Formulários funcionam com o JavaScript ainda carregando, o que é ganho de acessibilidade real e
  não retórico.
- O argumento da ADR 0001 de que "um app nativo continua possível porque a camada de API já é HTTP"
  enfraquece: um cliente nativo exigiria expor os casos de uso por Route Handlers depois. O custo é
  baixo porque a regra já está em `application/`, não nas ações.
- Toda ação precisa reconferir a sessão: ser chamável por POST direto significa que a tela não é
  barreira de autorização.

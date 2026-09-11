# 0005 — CPF como identificador de login, com recuperação por OTP

**Status:** aceita

## Contexto

Parte dos artesãos tem pouca familiaridade com tecnologia e muitos não têm e-mail ativo. Com o
autocadastro (ADR 0004), não existe curador para criar contas nem para resetar senhas.

## Decisão

Login com **CPF + senha**. O telefone é obrigatório e serve de canal de recuperação por OTP. O
e-mail é opcional.

## Alternativas descartadas

- **Telefone como identificador**: é o número que a pessoa mais digita, mas muda a cada troca de
  chip, deixando a conta órfã.
- **Aceitar CPF ou telefone no mesmo campo**: pareceria mais conveniente, mas ambos têm 11 dígitos,
  e desambiguar por dígito verificador cria erro de autenticação silencioso.
- **Magic link por e-mail**: elimina a senha, mas obriga a sair do app e pressupõe e-mail ativo.

## Consequências

- CPF é dado pessoal sob a LGPD: nunca aparece em página pública, URL ou log. O value object `Cpf`
  expõe `masked` para quando o dono precisa se reconhecer.
- O núcleo do Better Auth exige e-mail obrigatório e único. O cadastro sintetiza
  `<cpf>@local.artesanal` e substitui por um endereço real se o artesão fornecer um. Esse valor
  nunca é exibido.
- Sem provedor de SMS/WhatsApp contratado, o OTP é impresso no log do servidor em desenvolvimento;
  o provedor entra por variável de ambiente, sem mudança de código.

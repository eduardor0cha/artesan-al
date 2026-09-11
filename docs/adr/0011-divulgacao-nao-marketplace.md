# 0011 — Divulgação, não marketplace: contato por WhatsApp

**Status:** aceita

## Contexto

Encontrada a peça, o visitante precisa falar com quem a fez. A forma desse contato decide se o
sistema é uma plataforma de divulgação — o que o título do artigo promete — ou o começo de um
marketplace.

## Decisão

O contato acontece **fora do sistema**: botão "Falar no WhatsApp" (`wa.me`, com mensagem já escrita
citando a peça ou o ponto de venda) e o número clicável para ligar, ambos a partir do
`public_phone` do artesão. Não há mensagem interna, carrinho, reserva nem pagamento.

## Alternativas descartadas

- **Mensagem dentro do aplicativo**: manteria o telefone privado e deixaria rastro do interesse,
  mas obriga o artesão a voltar ao app para descobrir que tem recado — e, sem provedor de SMS
  contratado (ADR 0005), não há como avisá-lo.
- **Carrinho e pedido**: seria o passo seguinte natural do produto, mas puxa pagamento, frete e
  conta de visitante. É outro trabalho.

## Consequências

- Zero infraestrutura de mensageria e nenhuma conta exigida do visitante: ele nunca se cadastra.
- O telefone público do artesão é exposto por decisão dele, e é campo separado do número de
  recuperação guardado pelo Better Auth — trocar de chip não quebra a conta nem apaga o contato.
- O sistema não tem como medir venda, só visita. Se a avaliação com artesãos precisar de conversão,
  será por relato, não por dado do sistema.

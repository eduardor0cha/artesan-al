# 0008 — Acessibilidade e inclusão como requisito verificável

**Status:** aceita

## Contexto

O propósito do sistema é incluir artesãos com pouca familiaridade digital. Tratar acessibilidade
como acabamento faria o artefato contradizer a tese do artigo.

## Decisão

WCAG 2.2 nível AA como requisito de projeto, verificado automaticamente: `eslint-plugin-jsx-a11y`
no lint e `@axe-core/playwright` como asserção nos testes E2E — uma violação falha o build como
qualquer outro defeito. O dispositivo de referência dos testes E2E é um Android mediano, não um
navegador de desktop.

## Alternativas descartadas

- **Auditoria manual periódica**: encontra mais coisa, mas não impede regressão entre auditorias.
- **axe como relatório informativo**: vira ruído que ninguém lê.

## Consequências

- Componentes vêm do shadcn/ui, sobre Radix, com foco, teclado e ARIA corretos por padrão.
- Alvos de toque começam em 44px; não existe variante menor de botão.
- Fontes de sistema, sem download de webfont, para primeiro paint imediato em 3G.
- Zoom permanece habilitado e `prefers-reduced-motion` é respeitado globalmente.

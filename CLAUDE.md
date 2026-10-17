@AGENTS.md

# SOMA — guia para assistentes de código

Plataforma gratuita de estudos para o ENEM. Veja o README para visão geral e rotas.

## Regras do projeto

- Responda e escreva textos de interface em português do Brasil.
- Regras de aprendizagem ficam em `src/lib/learning.ts` como funções puras, sempre com testes em `learning.test.ts`.
- Conteúdo fica em `src/content/data/*.json`. As telas acessam conteúdo só por `src/content/index.ts`.
- Nunca marque conteúdo como `"revisado"` sem confirmação humana. Nunca apresente conteúdo como oficial do INEP sem fonte.
- Toda questão nova de Matemática precisa da conta do gabarito em `src/content/content.test.ts`.
- Cores e fontes vêm dos tokens em `src/app/globals.css` (ex.: `bg-primary`, `text-muted`). Não use hexadecimais soltos em componentes novos.
- Acessibilidade: alvos de toque com no mínimo 44px, elementos nativos (`button`, `a`, `input`), foco visível e contraste AA.
- Não colete dados pessoais. O progresso fica no navegador (`src/lib/progress-store.ts`).

## Antes de concluir uma alteração

```bash
npm test && npm run lint && npm run build
```

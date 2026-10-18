# SOMA

**Sistema de Organização, Memorização e Aprendizagem**: uma plataforma gratuita de estudos que começa pelo ENEM.

Esta é a **v0.1**: uma fatia vertical de Matemática que entrega o ciclo completo de aprendizagem.

> estudar → praticar → entender o erro → guardar no caderno → refazer depois → ver a evolução

## O que já funciona

| Tela | Rota | O que faz |
| --- | --- | --- |
| Início | `/` | Continua de onde o estudante parou, mostra erros pendentes e a meta semanal |
| Trilha | `/estudar` | Tópicos de Matemática em ordem sugerida, sem bloqueios |
| Tópico | `/estudar/[topico]` | Ideia-chave, fórmulas, alerta de erro comum e exemplo resolvido |
| Prática | `/praticar/[topico]` | Questões com feedback, raciocínio, armadilha comum e causa do erro |
| Caderno de erros | `/erros` | Erros para refazer e erros resolvidos |
| Refazer | `/revisar/[questao]` | Refaz uma questão do caderno |
| Progresso | `/progresso` | Domínio por tópico, questões da semana, cartões aprendidos, conquistas, simulados e XP |
| Técnicas | `/tecnicas` | 10 técnicas de cálculo rápido (método das linhas, vezes 11, quadrados terminados em 5, método védico perto de 100, noves fora...) |
| Técnica | `/tecnicas/[tecnica]` | Passo a passo com os números do estudante, por que funciona, origem e treino cronometrado |
| Desafio do dia | `/desafio` | 3 questões de tópicos diferentes, iguais para todo mundo no mesmo dia |
| Sobre | `/sobre` | Missão, como o SOMA ensina, privacidade e origem do conteúdo (com link para as provas oficiais do INEP) |
| Revisão de conteúdo | `/revisao-conteudo` | Para revisores: conferir cada questão, cartão, explicação e técnica, comentar e baixar a revisão |
| Simulado | `/simulado` | Questões misturadas por tópico, cronômetro opcional, correção só no final e relatório por tópico |
| Cartões | `/cartoes` | Revisão espaçada dos cartões de memória vencidos e novos |
| Cartões do tópico | `/cartoes/[topico]` | Revisa os cartões de um tópico específico |

No celular, a navegação fica embaixo; no computador, vira um menu lateral. Depois de aberto uma vez, o SOMA **funciona sem internet** nas telas já visitadas (service worker em `public/sw.js`: rede primeiro, cópia salva quando não há conexão). O app segue o **modo claro ou escuro** do aparelho e pode ser **adicionado à tela inicial** do celular (manifesto e ícones em `src/app/manifest.ts` e `public/icons/`).

A trilha de Matemática tem **6 tópicos com 45 questões**: 32 de múltipla escolha e 13 de **resposta numérica**, em que o estudante digita o número (aceita vírgula, ponto e "R$"). Os tópicos são Porcentagem, Razão e proporção, Regra de três, Funções do 1º grau, Leitura de gráficos e tabelas e **Técnicas de cálculo rápido**. As questões de tabela mostram os dados numa tabela acessível.

## Como rodar no seu computador

Pré-requisito: [Node.js](https://nodejs.org) 20.9 ou mais novo.

```bash
npm install      # instala as dependências (só na primeira vez)
npm run dev      # abre o modo de desenvolvimento
```

Depois abra <http://localhost:3000> no navegador. Para simular um celular, use as ferramentas de desenvolvedor do navegador (F12) e ative o modo de dispositivo.

### Outros comandos

```bash
npm test         # roda os testes das regras de aprendizagem e do conteúdo
npm run lint     # procura problemas no código
npm run build    # gera a versão de produção (também confere os tipos)
npm run test:e2e # percorre os fluxos principais num navegador (rode depois do build)
```

Na primeira vez que for rodar `test:e2e`, instale o navegador de testes com `npx playwright install chromium`.

A cada envio para o GitHub, a verificação automática roda testes, lint, build e os fluxos no navegador, no celular e no computador. O resultado aparece na aba **Actions** do repositório.

## Como publicar na internet (Vercel, gratuito)

1. Crie uma conta em [vercel.com](https://vercel.com) usando **Continue with GitHub**.
2. Clique em **Add New… → Project** e importe o repositório **SOMA**.
3. A Vercel reconhece o Next.js sozinha: não mude nada e clique em **Deploy**.
4. Em cerca de 2 minutos, o SOMA ganha um endereço público (ex.: `soma-xxxx.vercel.app`).

Depois disso, cada envio para o branch `main` publica a versão nova automaticamente. Se usar um domínio próprio, defina a variável de ambiente `NEXT_PUBLIC_SITE_URL` com o endereço completo (ex.: `https://soma.exemplo.com.br`) para a imagem de compartilhamento apontar para ele.

## Como o projeto está organizado

```
src/
├── app/                  Telas (cada pasta é uma rota)
├── components/           Peças de interface reutilizáveis
│   └── views/            Partes das telas que dependem do progresso salvo
├── content/
│   ├── data/             Conteúdo em JSON (tópicos e questões)
│   ├── types.ts          Formato esperado do conteúdo
│   └── index.ts          Único ponto de acesso ao conteúdo
└── lib/
    ├── learning.ts       Regras de aprendizagem (domínio, erros, XP, meta semanal)
    └── progress-store.ts Onde o progresso é salvo (navegador)
```

Princípios por trás dessa divisão:

- **Regras separadas da interface.** `learning.ts` só tem funções puras e testadas. As telas apenas exibem o resultado.
- **Conteúdo separado do código.** Para adicionar uma questão, edite o JSON. A origem dos dados pode virar um banco no futuro mudando só `content/index.ts`.
- **Progresso local.** Na v0.1, tudo fica no `localStorage` do navegador. Não há login nem coleta de dados pessoais.

## Como adicionar uma questão

1. Abra `src/content/data/matematica.json`.
2. Copie uma questão existente dentro de `"questions"` e mude o `id` (ex.: `porc-005`).
3. Preencha enunciado, alternativas, `correctId`, raciocínio e explicação.
4. Mantenha `"reviewStatus": "aguardando-revisao"` até uma pessoa revisar.
   - Múltipla escolha: `"kind": "multipla-escolha"`, com `alternatives`, `correctId` e, se quiser, `trap`.
   - Resposta numérica: `"kind": "numerica"`, com `answer`, `tolerance`, `prefix` ou `unit` e `commonMistakes` (erros previsíveis com explicação própria).
5. Adicione a conta do gabarito em `src/content/content.test.ts` e rode `npm test`.

## Como revisar o conteúdo

1. Abra `/revisao-conteudo` (há um link em **Sobre o SOMA**).
2. Para cada item, marque **Está certo** ou **Precisa de ajuste** e, se quiser, escreva um comentário.
3. Clique em **Baixar revisão** e envie o arquivo `soma-revisao-AAAA-MM-DD.json` para quem mantém o conteúdo.
4. Quem mantém aplica os ajustes e, só então, troca `"reviewStatus"` para `"revisado"` no JSON.

A revisão fica salva no navegador de quem revisa, separada do progresso de estudo.

## Regras de aprendizagem (v0.1)

- **Prática em rodadas:** cada prática tem até 5 questões. Primeiro entram as nunca respondidas; depois, as erradas na última tentativa e as vistas há mais tempo (`pickPracticeQuestions`).
- **Caderno de erros:** toda questão errada entra. Ela fica "resolvida" quando a tentativa mais recente acerta.
- **Domínio do tópico:**
  - *Praticando*: começou o tópico.
  - *Consolidando*: respondeu todas as questões e acertou pelo menos 75% de primeira.
  - *Dominado*: consolidando, sem erros pendentes e com acertos em dois dias diferentes.
- **Cartões de memória (caixas de Leitner):** cada cartão fica numa caixa de 1 a 5. "Fácil" sobe de caixa, "Difícil" mantém e "Errei" volta para a caixa 1 e repete na mesma sessão. As revisões voltam em 1, 3, 7, 16 e 35 dias. Cartões novos só aparecem de tópicos já abertos ou praticados, no máximo 10 por dia. Regras em `src/lib/spaced-repetition.ts`.
- **XP mede esforço, não domínio:** +5 por resposta, +5 por acertar de primeira, +5 por registrar a causa de um erro, +10 por corrigir um erro e +2 por cartão revisado.
- **Simulado:** as questões são sorteadas equilibrando os tópicos escolhidos (5, 10 ou 15). Com cronômetro, são 3 minutos por questão e o simulado é entregue quando o tempo acaba. As respondidas viram tentativas (as erradas vão para o caderno de erros); as em branco não contam. Regras em `src/lib/exam.ts`.
- **Por que você erra:** em Progresso, as causas de erro mais apontadas pelo estudante aparecem com uma dica prática para a mais comum (`getCauseStats` e `CAUSE_TIPS`).
- **Conquistas:** 9 marcos calculados a partir do progresso (sem nada guardado à parte), que premiam hábitos de aprendizagem: registrar a causa de um erro, corrigi-lo, levar um cartão à caixa 3, dominar um tópico. Regras em `src/lib/achievements.ts`.
- **Técnicas de cálculo:** cada técnica é programada passo a passo em `src/lib/mental-math.ts` e testada contra a conta tradicional em milhares de casos sorteados. Os textos (por que funciona, de onde vem) ficam em `src/content/data/tecnicas.json`. O treino tem 10 contas; o relógio só corre com a conta na tela. +1 XP por conta certa.
- **Desafio do dia:** as questões são sorteadas a partir da data, então todo mundo recebe as mesmas no mesmo dia. Vale o primeiro resultado do dia. Não existe sequência que zera. Regras em `src/lib/daily.ts`.
- **Cópia de segurança:** em Progresso, o estudante baixa um arquivo com o progresso e pode restaurá-lo em outro aparelho. O arquivo é conferido antes de ser aceito (`src/lib/backup.ts`).
- **Meta semanal:** 5 dias de estudo por semana. Perder um dia não zera nada.

## Conteúdo e direitos autorais

Todas as questões e explicações atuais são **autorais do SOMA** e estão marcadas como **aguardando revisão humana**. Nenhum conteúdo é apresentado como oficial do INEP.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Vitest · fontes Atkinson Hyperlegible e Space Grotesk servidas localmente via Fontsource.

## Próximos passos sugeridos

- Revisão humana das 45 questões, dos 31 cartões, das explicações e dos textos das técnicas (inclusive as notas históricas)
- Mais questões por tópico (o ideal é ter questões novas para revisar depois de alguns dias)
- Publicação gratuita (ex.: Vercel) para testar com estudantes reais

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
| Progresso | `/progresso` | Domínio por tópico, questões da semana e XP |

A trilha de Matemática tem **5 tópicos com 20 questões**: Porcentagem, Razão e proporção, Regra de três, Funções do 1º grau e Leitura de gráficos e tabelas. As questões de tabela mostram os dados numa tabela acessível.

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
```

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
5. Adicione a conta do gabarito em `src/content/content.test.ts` e rode `npm test`.

## Regras de aprendizagem (v0.1)

- **Caderno de erros:** toda questão errada entra. Ela fica "resolvida" quando a tentativa mais recente acerta.
- **Domínio do tópico:**
  - *Praticando*: começou o tópico.
  - *Consolidando*: respondeu todas as questões e acertou pelo menos 75% de primeira.
  - *Dominado*: consolidando, sem erros pendentes e com acertos em dois dias diferentes.
- **XP mede esforço, não domínio:** +5 por resposta, +5 por acertar de primeira, +5 por registrar a causa de um erro e +10 por corrigir um erro.
- **Meta semanal:** 5 dias de estudo por semana. Perder um dia não zera nada.

## Conteúdo e direitos autorais

Todas as questões e explicações atuais são **autorais do SOMA** e estão marcadas como **aguardando revisão humana**. Nenhum conteúdo é apresentado como oficial do INEP.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Vitest · fontes Atkinson Hyperlegible e Space Grotesk servidas localmente via Fontsource.

## Próximos passos sugeridos

- Revisão humana das 20 questões e das explicações
- Mais questões por tópico (o ideal é ter questões novas para revisar depois de alguns dias)
- Publicação gratuita (ex.: Vercel) para testar com estudantes reais
- Layout próprio para telas grandes e modo escuro
- Flashcards com repetição espaçada

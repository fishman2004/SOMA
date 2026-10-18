/**
 * Questões gêmeas: moldes que geram questões novas, com números e
 * contextos diferentes, a partir de uma semente.
 *
 * A mesma semente sempre gera a mesma questão, então uma questão gêmea
 * pode ser guardada no progresso só pelo id ("gemea:molde:semente").
 * As contas são feitas aqui e conferidas em `twins.test.ts` para milhares
 * de sementes.
 */
import { seededRandom } from "@/lib/exam";
import { getAlgorithm } from "@/lib/mental-math";
import type { Alternative, MultipleChoiceQuestion, NumericQuestion, Question, Source } from "./types";

type Random = () => number;

export interface TwinGenerator {
  id: string;
  topicId: string;
  /** Nome curto do tipo de questão, ex.: "Aumento seguido de desconto". */
  name: string;
  /** Questões fixas que este molde reproduz com números novos. */
  sourceIds: string[];
  build: (random: Random) => Omit<Question, "id" | "topicId" | "source">;
}

export const TWIN_SOURCE: Source = {
  origin: "soma",
  label: "Questão gêmea gerada pelo SOMA",
  reviewStatus: "aguardando-revisao",
};

export const TWIN_PREFIX = "gemea:";

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const ri = (r: Random, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const pick = <T,>(r: Random, list: readonly T[]): T => list[Math.floor(r() * list.length)];

/** Arredonda para evitar ruído de ponto flutuante (ex.: 0,1 + 0,2). */
const clean = (n: number) => Math.round(n * 1e6) / 1e6;
const fmt = (n: number) => clean(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const brl = (n: number) =>
  `R$ ${clean(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function shuffle<T>(r: Random, list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function numeric(
  q: Omit<NumericQuestion, "id" | "topicId" | "source" | "kind" | "commonMistakes"> & {
    mistakes?: { value: number; explanation: string }[];
  },
): Omit<NumericQuestion, "id" | "topicId" | "source"> {
  const { mistakes, ...rest } = q;
  const tolerance = rest.tolerance ?? 0;
  const commonMistakes = (mistakes ?? []).filter(
    (m, i, all) =>
      Number.isFinite(m.value) &&
      Math.abs(m.value - q.answer) > tolerance + 1e-9 &&
      all.findIndex((x) => Math.abs(x.value - m.value) < 1e-9) === i,
  );
  return { kind: "numerica", ...rest, answer: clean(q.answer), commonMistakes };
}

/* Contextos para variar as histórias. */
const ITEMS = [
  { name: "uma camiseta", Name: "Uma camiseta" },
  { name: "um tênis", Name: "Um tênis" },
  { name: "uma mochila", Name: "Uma mochila" },
  { name: "um fone de ouvido", Name: "Um fone de ouvido" },
  { name: "uma bicicleta", Name: "Uma bicicleta" },
  { name: "um livro", Name: "Um livro" },
  { name: "uma cadeira", Name: "Uma cadeira" },
] as const;

/* ------------------------------------------------------------------ */
/* Porcentagem                                                         */
/* ------------------------------------------------------------------ */

const aumentoDesconto: TwinGenerator = {
  id: "aumento-desconto",
  topicId: "porcentagem",
  name: "Aumento seguido de desconto",
  sourceIds: ["porc-001"],
  build: (r) => {
    let P = 0;
    let a = 0;
    let d = 0;
    // Escolhe números que deem um preço final em centavos exatos.
    do {
      P = 20 * ri(r, 2, 15);
      a = pick(r, [10, 20, 25, 50]);
      d = pick(r, [10, 20, 25, 40, 50]);
    } while ((P * (100 + a) * (100 - d)) % 100 !== 0);
    const correct = (P * (100 + a) * (100 - d)) / 10000;
    const soma = (P * (100 + a - d)) / 100;
    const candidates = [soma, (P * (100 + a)) / 100, (P * (100 - d)) / 100, P, correct + P / 10, correct - P / 10];
    const distractors = [soma, ...candidates.filter((v) => v !== soma)]
      .filter((v, i, all) => v > 0 && Math.abs(v - correct) > 1e-9 && all.indexOf(v) === i)
      .slice(0, 4);
    const values = shuffle(r, [correct, ...distractors]);
    const letters = ["A", "B", "C", "D", "E"];
    const alternatives: Alternative[] = values.map((v, i) => ({ id: letters[i], text: brl(v) }));
    const correctId = letters[values.indexOf(correct)];
    const trapId = letters[values.indexOf(soma)];
    const item = pick(r, ITEMS);
    const q: Omit<MultipleChoiceQuestion, "id" | "topicId" | "source"> = {
      kind: "multipla-escolha",
      statement: `${item.Name} custava ${brl(P)}. A loja aumentou o preço em ${a}% e, depois, deu um desconto de ${d}% sobre o novo preço.`,
      prompt: "Qual é o preço final?",
      alternatives,
      correctId,
      difficulty: "media",
      reasoning: [
        `Aumento de ${a}%: fator ${fmt(1 + a / 100)}`,
        `Desconto de ${d}%: fator ${fmt(1 - d / 100)}`,
        `${fmt(P)} × ${fmt(1 + a / 100)} × ${fmt(1 - d / 100)} = ${fmt(correct)}`,
      ],
      explanation: "Aumentos e descontos seguidos se multiplicam: o desconto incide sobre o preço já aumentado.",
      trap: {
        alternativeId: trapId,
        explanation: `${brl(soma)} vem de somar +${a}% e −${d}%. Os percentuais se multiplicam: ${fmt(1 + a / 100)} × ${fmt(1 - d / 100)}.`,
      },
    };
    return q;
  },
};

const GROUPS = [
  { group: "estudantes de uma turma", fact: "foram aprovados na prova", ask: "Quantos estudantes foram aprovados?", unit: "estudantes" },
  { group: "pessoas entrevistadas", fact: "disseram que usam transporte público", ask: "Quantas pessoas usam transporte público?", unit: "pessoas" },
  { group: "moradores de um prédio", fact: "têm animal de estimação", ask: "Quantos moradores têm animal de estimação?", unit: "moradores" },
  { group: "jogos de um campeonato", fact: "terminaram empatados", ask: "Quantos jogos terminaram empatados?", unit: "jogos" },
] as const;

const porcentagemDe: TwinGenerator = {
  id: "porcentagem-de",
  topicId: "porcentagem",
  name: "Porcentagem de uma quantidade",
  sourceIds: ["porc-002"],
  build: (r) => {
    let N = 0;
    let p = 0;
    do {
      N = pick(r, [20, 25, 40, 50, 60, 80, 120, 200, 300]);
      p = 5 * ri(r, 1, 19);
    } while ((N * p) % 100 !== 0);
    const answer = (N * p) / 100;
    const g = pick(r, GROUPS);
    return numeric({
      statement: `Em um grupo de ${N} ${g.group}, ${p}% ${g.fact}.`,
      prompt: g.ask,
      answer,
      unit: g.unit,
      difficulty: "facil",
      reasoning: [`${p}% = ${fmt(p / 100)}`, `${N} × ${fmt(p / 100)} = ${fmt(answer)}`],
      explanation: `${p}% de ${N} é ${fmt(answer)}.`,
      mistakes: [
        {
          value: N - answer,
          explanation: `${fmt(N - answer)} é a outra parte do grupo (${100 - p}%). Releia o que a pergunta pede.`,
        },
      ],
    });
  },
};

const PRICES = ["o quilo do feijão", "a passagem de ônibus", "a mensalidade do curso", "o ingresso do cinema", "o litro do leite"] as const;

const variacaoPercentual: TwinGenerator = {
  id: "variacao-percentual",
  topicId: "porcentagem",
  name: "Variação percentual",
  sourceIds: ["porc-003", "porc-007"],
  build: (r) => {
    const up = r() < 0.6;
    const old = pick(r, [4, 5, 8, 10, 12, 20, 25, 40, 50, 80, 120, 250]);
    const pct = up ? pick(r, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]) : pick(r, [10, 20, 25, 30, 40, 50]);
    const next = (old * (100 + (up ? pct : -pct))) / 100;
    const diff = Math.abs(next - old);
    const wrongBase = (diff / next) * 100;
    const thing = pick(r, PRICES);
    return numeric({
      statement: `O preço de ${thing} ${up ? "subiu" : "caiu"} de ${brl(old)} para ${brl(next)}.`,
      prompt: `Qual foi ${up ? "o aumento" : "a queda"} percentual?`,
      answer: pct,
      unit: "%",
      difficulty: "media",
      reasoning: [
        `${up ? "Aumento" : "Queda"}: ${fmt(Math.max(old, next))} − ${fmt(Math.min(old, next))} = ${fmt(diff)}`,
        `${fmt(diff)} ÷ ${fmt(old)} = ${fmt(pct / 100)} = ${pct}%`,
      ],
      explanation: "A variação percentual é sempre calculada em relação ao valor antigo.",
      mistakes: Number.isInteger(clean(wrongBase))
        ? [
            {
              value: clean(wrongBase),
              explanation: `${fmt(wrongBase)}% divide pelo valor novo (${fmt(next)}). A base da variação é o valor antigo, ${fmt(old)}.`,
            },
          ]
        : [],
    });
  },
};

const percentuaisSucessivos: TwinGenerator = {
  id: "percentuais-sucessivos",
  topicId: "porcentagem",
  name: "Descontos ou aumentos seguidos",
  sourceIds: ["porc-004"],
  build: (r) => {
    const discount = r() < 0.6;
    const p1 = discount ? pick(r, [10, 20, 30, 40, 50]) : pick(r, [10, 20, 50]);
    const p2 = discount ? pick(r, [10, 20, 30, 40, 50]) : pick(r, [10, 20, 50]);
    const factor = discount ? ((100 - p1) * (100 - p2)) / 10000 : ((100 + p1) * (100 + p2)) / 10000;
    const total = discount ? 100 - factor * 100 : factor * 100 - 100;
    const item = pick(r, ITEMS);
    const word = discount ? "desconto" : "aumento";
    return numeric({
      statement: `O preço de ${item.name} teve dois ${word}s seguidos: primeiro de ${p1}% e depois de ${p2}%.`,
      prompt: `Qual foi o ${word} total sobre o preço original?`,
      answer: total,
      unit: "%",
      difficulty: "media",
      reasoning: [
        `${fmt(discount ? 1 - p1 / 100 : 1 + p1 / 100)} × ${fmt(discount ? 1 - p2 / 100 : 1 + p2 / 100)} = ${fmt(factor)}`,
        discount ? `1 − ${fmt(factor)} = ${fmt(total / 100)} = ${fmt(total)}%` : `${fmt(factor)} − 1 = ${fmt(total / 100)} = ${fmt(total)}%`,
      ],
      explanation: `O segundo ${word} incide sobre um preço que já mudou, por isso o total não é ${p1}% + ${p2}%.`,
      mistakes: [
        { value: p1 + p2, explanation: `${p1 + p2}% soma os percentuais. Eles se multiplicam: use os fatores.` },
      ],
    });
  },
};

const precoFinal: TwinGenerator = {
  id: "preco-final",
  topicId: "porcentagem",
  name: "Preço com desconto ou aumento",
  sourceIds: ["porc-005", "porc-006"],
  build: (r) => {
    const discount = r() < 0.6;
    const P = 10 * ri(r, 5, 200);
    const p = discount ? pick(r, [5, 10, 15, 20, 25, 30, 40]) : pick(r, [5, 8, 10, 12, 15, 20]);
    const final = (P * (100 + (discount ? -p : p))) / 100;
    const change = (P * p) / 100;
    const item = pick(r, ITEMS);
    return numeric({
      statement: discount
        ? `${item.Name} custava ${brl(P)} e foi vendido com ${p}% de desconto.`
        : `O preço de ${item.name}, que era ${brl(P)}, teve um aumento de ${p}%.`,
      prompt: discount ? "Qual foi o preço com desconto?" : "Qual é o novo preço?",
      answer: final,
      prefix: "R$",
      tolerance: 0.01,
      difficulty: "facil",
      reasoning: [
        `${discount ? "Desconto" : "Aumento"} de ${p}%: fator ${fmt(1 + (discount ? -p : p) / 100)}`,
        `${fmt(P)} × ${fmt(1 + (discount ? -p : p) / 100)} = ${fmt(final)}`,
      ],
      explanation: `O preço ${discount ? "final" : "novo"} é ${brl(final)}.`,
      mistakes: [
        {
          value: change,
          explanation: `${brl(change)} é o valor do ${discount ? "desconto" : "aumento"}, não o preço ${discount ? "final" : "novo"}.`,
        },
        {
          value: (P * (100 + (discount ? p : -p))) / 100,
          explanation: discount
            ? `Esse é o preço com aumento de ${p}%. Num desconto, o fator é ${fmt(1 - p / 100)}.`
            : `Esse é o preço com desconto de ${p}%. Num aumento, o fator é ${fmt(1 + p / 100)}.`,
        },
      ],
    });
  },
};

/* ------------------------------------------------------------------ */
/* Razão e proporção                                                   */
/* ------------------------------------------------------------------ */

const RECIPES = [
  { ing: "xícaras de farinha", short: "xícaras", portions: "pães" },
  { ing: "ovos", short: "ovos", portions: "panquecas" },
  { ing: "colheres de açúcar", short: "colheres", portions: "copos de suco" },
  { ing: "litros de leite", short: "litros", portions: "porções de mingau" },
] as const;

const receita: TwinGenerator = {
  id: "receita-proporcional",
  topicId: "razao-e-proporcao",
  name: "Receita na proporção",
  sourceIds: ["rp-001", "rp-004"],
  build: (r) => {
    const rec = pick(r, RECIPES);
    const a = ri(r, 1, 6);
    const b = pick(r, [2, 3, 4, 5, 6, 8, 10]);
    const k = ri(r, 2, 5);
    const c = b * k;
    const answer = a * k;
    return numeric({
      statement: `Uma receita usa ${a} ${rec.ing} para fazer ${b} ${rec.portions}.`,
      prompt: `Mantendo a proporção, quantas ${rec.short} são necessárias para ${c} ${rec.portions}?`,
      answer,
      unit: rec.short,
      difficulty: "facil",
      reasoning: [`${c} ${rec.portions} = ${k} × ${b}`, `${a} × ${k} = ${answer}`],
      explanation: `Se a quantidade de ${rec.portions} é multiplicada por ${k}, os ingredientes também são.`,
      mistakes: [
        {
          value: a + (c - b),
          explanation: `Somar a diferença (${c} − ${b}) não respeita a proporção. As quantidades crescem multiplicando.`,
        },
      ],
    });
  },
};

const escala: TwinGenerator = {
  id: "escala",
  topicId: "razao-e-proporcao",
  name: "Escala de mapa",
  sourceIds: ["rp-002", "rp-005", "rp-007"],
  build: (r) => {
    const E = pick(r, [20_000, 25_000, 50_000, 100_000, 200_000, 500_000]);
    const cm = ri(r, 2, 12);
    const realCm = cm * E;
    const inKm = realCm >= 100_000;
    const answer = inKm ? realCm / 100_000 : realCm / 100;
    const unit = inKm ? "km" : "m";
    return numeric({
      statement: `Um mapa foi desenhado na escala 1 : ${E.toLocaleString("pt-BR")}. Nele, a distância entre dois pontos é de ${cm} cm.`,
      prompt: `Qual é a distância real, em ${inKm ? "quilômetros" : "metros"}?`,
      answer,
      unit,
      tolerance: 0.001,
      difficulty: "media",
      reasoning: [
        `${cm} × ${E.toLocaleString("pt-BR")} = ${realCm.toLocaleString("pt-BR")} cm`,
        inKm
          ? `${realCm.toLocaleString("pt-BR")} cm ÷ 100.000 = ${fmt(answer)} km`
          : `${realCm.toLocaleString("pt-BR")} cm ÷ 100 = ${fmt(answer)} m`,
      ],
      explanation: `Cada 1 cm no mapa vale ${E.toLocaleString("pt-BR")} cm na realidade. Depois, converta a unidade.`,
      mistakes: [
        {
          value: answer * 10,
          explanation: `Confira a conversão: 1 ${unit} = ${inKm ? "100.000" : "100"} cm.`,
        },
        { value: answer / 10, explanation: `Confira a conversão: 1 ${unit} = ${inKm ? "100.000" : "100"} cm.` },
      ],
    });
  },
};

const NAMES = [
  ["Ana", "Bruno"],
  ["Carla", "Diego"],
  ["Elisa", "Fábio"],
  ["Gabi", "Hugo"],
] as const;

const divisaoProporcional: TwinGenerator = {
  id: "divisao-proporcional",
  topicId: "razao-e-proporcao",
  name: "Divisão em partes proporcionais",
  sourceIds: ["rp-003", "rp-006", "rp-008"],
  build: (r) => {
    let a = 0;
    let b = 0;
    do {
      a = ri(r, 1, 5);
      b = ri(r, 1, 5);
    } while (a === b);
    const parts = a + b;
    const T = parts * 50 * ri(r, 1, 30);
    const answer = (T * a) / parts;
    const [first, second] = pick(r, NAMES);
    return numeric({
      statement: `${first} e ${second} vão dividir um prêmio de ${brl(T)} na razão ${a} para ${b} (${first} fica com ${a} partes e ${second}, com ${b}).`,
      prompt: `Quanto ${first} recebe?`,
      answer,
      prefix: "R$",
      tolerance: 0.01,
      difficulty: "media",
      reasoning: [`${a} + ${b} = ${parts} partes`, `${fmt(T)} ÷ ${parts} = ${fmt(T / parts)} por parte`, `${first}: ${a} × ${fmt(T / parts)} = ${fmt(answer)}`],
      explanation: `${second} recebe ${brl(T - answer)}. Somando as duas partes, dá ${brl(T)}.`,
      mistakes: [
        { value: T / 2, explanation: "Dividir ao meio ignora a razão combinada." },
        { value: T - answer, explanation: `${brl(T - answer)} é a parte de ${second}.` },
      ],
    });
  },
};

/* ------------------------------------------------------------------ */
/* Regra de três                                                       */
/* ------------------------------------------------------------------ */

const INVERSE = [
  { who: "pedreiros", unit: "dias", task: "constroem um muro", again: "construir o mesmo muro" },
  { who: "torneiras iguais", unit: "horas", task: "enchem um tanque", again: "encher o mesmo tanque" },
  { who: "máquinas iguais", unit: "horas", task: "produzem um lote de peças", again: "produzir o mesmo lote" },
  { who: "pintores", unit: "dias", task: "pintam uma escola", again: "pintar a mesma escola" },
] as const;

const regraInversa: TwinGenerator = {
  id: "regra-de-tres-inversa",
  topicId: "regra-de-tres",
  name: "Regra de três inversa",
  sourceIds: ["r3-001", "r3-003", "r3-005", "r3-007"],
  build: (r) => {
    let w1 = 0;
    let d1 = 0;
    let w2 = 0;
    do {
      w1 = ri(r, 2, 12);
      d1 = ri(r, 2, 30);
      w2 = ri(r, 2, 15);
    } while (w1 === w2 || (w1 * d1) % w2 !== 0);
    const answer = (w1 * d1) / w2;
    const c = pick(r, INVERSE);
    const direct = (d1 * w2) / w1;
    return numeric({
      statement: `${w1} ${c.who} ${c.task} em ${d1} ${c.unit}, sempre no mesmo ritmo.`,
      prompt: `Em quantos ${c.unit} ${w2} ${c.who} conseguem ${c.again}?`,
      answer,
      unit: c.unit,
      tolerance: 0.01,
      difficulty: "media",
      reasoning: [
        `${w2 > w1 ? "Mais" : "Menos"} ${c.who}, ${w2 > w1 ? "menos" : "mais"} ${c.unit}: relação inversa`,
        `${w1} × ${d1} = ${w2} × x`,
        `x = ${w1 * d1} ÷ ${w2} = ${fmt(answer)} ${c.unit}`,
      ],
      explanation: "Em relações inversas, o produto das duas grandezas fica constante.",
      mistakes: [
        {
          value: clean(direct),
          explanation: `${fmt(direct)} vem de tratar a relação como direta. ${w2 > w1 ? "Mais" : "Menos"} ${c.who} não pode levar ${w2 > w1 ? "mais" : "menos"} tempo.`,
        },
      ],
    });
  },
};

const DIRECT = [
  { what: "páginas", rateText: "uma impressora imprime", unit: "minutos", ask: "imprimir" },
  { what: "litros", rateText: "uma torneira despeja", unit: "minutos", ask: "despejar" },
  { what: "quilômetros", rateText: "um ciclista pedala", unit: "horas", ask: "pedalar" },
] as const;

const regraDireta: TwinGenerator = {
  id: "regra-de-tres-direta",
  topicId: "regra-de-tres",
  name: "Regra de três direta",
  sourceIds: ["r3-002", "r3-004", "r3-006"],
  build: (r) => {
    const rate = ri(r, 2, 30);
    const t1 = ri(r, 2, 10);
    let t2 = 0;
    do {
      t2 = ri(r, 3, 60);
    } while (t2 === t1);
    const q1 = rate * t1;
    const q2 = rate * t2;
    const c = pick(r, DIRECT);
    return numeric({
      statement: `Em ${t1} ${c.unit}, ${c.rateText} ${q1} ${c.what}, sempre no mesmo ritmo.`,
      prompt: `Quantos ${c.unit} são necessários para ${c.ask} ${q2} ${c.what}?`,
      answer: t2,
      unit: c.unit,
      tolerance: 0.01,
      difficulty: "facil",
      reasoning: [`Mais ${c.what}, mais tempo: relação direta`, `${q1}/${t1} = ${q2}/x`, `x = ${t1} × ${q2} ÷ ${q1} = ${t2}`],
      explanation: `O ritmo é de ${rate} ${c.what} por ${c.unit.slice(0, -1)}: ${q2} ÷ ${rate} = ${t2}.`,
      mistakes: [
        {
          value: clean((t1 * q1) / q2),
          explanation: "Esse valor vem da regra de três inversa. Fazer mais leva mais tempo: a relação é direta.",
        },
      ],
    });
  },
};

/* ------------------------------------------------------------------ */
/* Funções do 1º grau                                                  */
/* ------------------------------------------------------------------ */

const COSTS = [
  { text: (F: string, rr: string) => `Um plano de celular cobra ${F} fixos por mês mais ${rr} por minuto de ligação.`, ask: (x: number) => `Quanto paga quem fala ${x} minutos no mês?`, fixed: "o valor fixo" },
  { text: (F: string, rr: string) => `Um táxi cobra bandeirada de ${F} mais ${rr} por quilômetro rodado.`, ask: (x: number) => `Quanto custa uma corrida de ${x} km?`, fixed: "a bandeirada" },
  { text: (F: string, rr: string) => `Uma academia cobra ${F} de matrícula, paga uma única vez, e ${rr} por mês.`, ask: (x: number) => `Quanto uma pessoa paga, no total, em ${x} meses?`, fixed: "a matrícula" },
] as const;

const funcaoCusto: TwinGenerator = {
  id: "funcao-custo",
  topicId: "funcoes-1-grau",
  name: "Valor fixo mais valor por unidade",
  sourceIds: ["f1-001", "f1-005", "f1-006"],
  build: (r) => {
    const c = pick(r, COSTS);
    const isGym = c.fixed === "a matrícula";
    const F = 10 * ri(r, 1, 30);
    const rate = isGym ? 10 * ri(r, 5, 15) : pick(r, [0.5, 1, 1.5, 2, 2.5, 3]);
    const x = isGym ? ri(r, 2, 12) : ri(r, 3, 60);
    const answer = F + rate * x;
    return numeric({
      statement: c.text(brl(F), brl(rate)),
      prompt: c.ask(x),
      answer,
      prefix: "R$",
      tolerance: 0.01,
      difficulty: "facil",
      reasoning: [`f(x) = ${fmt(rate)}x + ${fmt(F)}`, `f(${x}) = ${fmt(rate)} × ${x} + ${fmt(F)} = ${fmt(answer)}`],
      explanation: `${brl(F)} é ${c.fixed} (o b da função) e ${brl(rate)} é o valor por unidade (o a).`,
      mistakes: [
        { value: rate * x, explanation: `${brl(rate * x)} é só a parte variável. Falta somar ${c.fixed}, ${brl(F)}.` },
        ...(isGym
          ? [{ value: (F + rate) * x, explanation: `Esse valor cobra a matrícula todo mês. Ela é paga uma única vez.` }]
          : []),
      ],
    });
  },
};

const raiz: TwinGenerator = {
  id: "raiz",
  topicId: "funcoes-1-grau",
  name: "Raiz da função",
  sourceIds: ["f1-002", "f1-004"],
  build: (r) => {
    const a = ri(r, 2, 9);
    let k = 0;
    do {
      k = ri(r, -9, 12);
    } while (k === 0);
    const b = a * k;
    const expr = b >= 0 ? `${a}x − ${b}` : `${a}x + ${-b}`;
    return numeric({
      statement: `Considere a função f(x) = ${expr}.`,
      prompt: "Para qual valor de x a função vale zero?",
      answer: k,
      difficulty: "facil",
      reasoning: [`${expr} = 0`, `${a}x = ${b}`, `x = ${b} ÷ ${a} = ${k}`],
      explanation: "Para achar a raiz, iguale a função a zero e isole o x.",
      mistakes: [
        { value: -k, explanation: `${-k} aparece quando o sinal não é trocado ao passar o número para o outro lado.` },
      ],
    }) as Omit<NumericQuestion, "id" | "topicId" | "source">;
  },
};

const taxaVariacao: TwinGenerator = {
  id: "taxa-de-variacao",
  topicId: "funcoes-1-grau",
  name: "Taxa de variação entre dois pontos",
  sourceIds: ["f1-003", "f1-007"],
  build: (r) => {
    const x1 = ri(r, 0, 5);
    const dx = ri(r, 2, 5);
    let m = 0;
    do {
      m = ri(r, -6, 8);
    } while (m === 0);
    const y1 = ri(r, -5, 20);
    const x2 = x1 + dx;
    const y2 = y1 + m * dx;
    return numeric({
      statement: `Uma função do 1º grau passa pelos pontos (${x1}, ${y1}) e (${x2}, ${y2}).`,
      prompt: "Qual é a taxa de variação (o valor de a)?",
      answer: m,
      difficulty: "media",
      reasoning: [`a = (${y2} − ${y1 < 0 ? `(${y1})` : y1}) ÷ (${x2} − ${x1})`, `a = ${m * dx} ÷ ${dx} = ${m}`],
      explanation: "A taxa de variação é a mudança em y dividida pela mudança em x.",
      mistakes: [{ value: m * dx, explanation: `${m * dx} é quanto y mudou. Falta dividir por quanto x mudou: ${dx}.` }],
    });
  },
};

/* ------------------------------------------------------------------ */
/* Leitura de gráficos e tabelas                                       */
/* ------------------------------------------------------------------ */

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho"] as const;
const SERIES = [
  { caption: "Chuva mensal (em milímetros)", header: "Chuva (mm)", unit: "mm", what: "a média mensal de chuva", step: 10 },
  { caption: "Sorvetes vendidos por mês", header: "Vendas", unit: "sorvetes", what: "a média de sorvetes vendidos por mês", step: 20 },
  { caption: "Visitantes de um museu por mês", header: "Visitantes", unit: "visitantes", what: "a média mensal de visitantes", step: 50 },
] as const;

const media: TwinGenerator = {
  id: "media",
  topicId: "graficos-e-tabelas",
  name: "Média a partir de uma tabela",
  sourceIds: ["gt-001", "gt-005"],
  build: (r) => {
    const s = pick(r, SERIES);
    const n = pick(r, [3, 4, 5]);
    let values: number[] = [];
    let sum = 0;
    // A média precisa ter no máximo 2 casas decimais (ex.: com 3 meses, a soma deve ser divisível por 3).
    do {
      values = Array.from({ length: n }, () => s.step * ri(r, 2, 30));
      sum = values.reduce((acc, v) => acc + v, 0);
    } while ((sum * 100) % n !== 0);
    const answer = sum / n;
    return numeric({
      statement: "A tabela mostra os dados registrados em alguns meses.",
      table: {
        caption: s.caption,
        headers: ["Mês", s.header],
        rows: values.map((v, i) => [MONTHS[i], v.toLocaleString("pt-BR")]),
      },
      prompt: `Qual foi ${s.what} nesse período?`,
      answer,
      unit: s.unit,
      tolerance: 0.01,
      difficulty: "facil",
      reasoning: [`${values.map((v) => v.toLocaleString("pt-BR")).join(" + ")} = ${sum.toLocaleString("pt-BR")}`, `${sum.toLocaleString("pt-BR")} ÷ ${n} = ${fmt(answer)}`],
      explanation: `A média é a soma dos valores dividida pela quantidade de meses (${n}).`,
      mistakes: [{ value: sum, explanation: `${sum.toLocaleString("pt-BR")} é a soma. Para a média, ainda falta dividir por ${n}.` }],
    });
  },
};

const notaQueFalta: TwinGenerator = {
  id: "nota-que-falta",
  topicId: "graficos-e-tabelas",
  name: "Nota que falta para a média",
  sourceIds: ["gt-006"],
  build: (r) => {
    let notes: number[] = [];
    let target = 0;
    let needed = -1;
    do {
      notes = Array.from({ length: 4 }, () => ri(r, 4, 10));
      target = pick(r, [6, 7, 8]);
      needed = target * 5 - notes.reduce((a, b) => a + b, 0);
    } while (needed < 0 || needed > 10 || needed === target);
    const name = pick(r, ["Júlia", "Marcos", "Bia", "Rafa", "Lucas"]);
    const sum = notes.reduce((a, b) => a + b, 0);
    return numeric({
      statement: `A tabela mostra as notas de ${name} nas quatro primeiras provas do ano.`,
      table: { caption: `Notas de ${name}`, headers: ["Prova", "Nota"], rows: notes.map((v, i) => [`${i + 1}ª`, String(v)]) },
      prompt: `Que nota ${name} precisa tirar na 5ª prova para terminar com média ${target}?`,
      answer: needed,
      difficulty: "media",
      reasoning: [`Média ${target} em 5 provas: soma total de ${target} × 5 = ${target * 5}`, `Soma atual: ${notes.join(" + ")} = ${sum}`, `Falta: ${target * 5} − ${sum} = ${needed}`],
      explanation: "Para atingir uma média, calcule a soma total necessária e veja quanto falta.",
      mistakes: [{ value: target, explanation: `${target} é a média desejada, não a nota que falta.` }],
    });
  },
};

const mediana: TwinGenerator = {
  id: "mediana",
  topicId: "graficos-e-tabelas",
  name: "Mediana a partir de uma tabela",
  sourceIds: ["gt-008"],
  build: (r) => {
    const n = pick(r, [5, 7]);
    const people = ["Ana", "Beto", "Caio", "Dani", "Edu", "Flora", "Gabi"].slice(0, n);
    const values = people.map(() => ri(r, 2, 20));
    const sorted = [...values].sort((a, b) => a - b);
    const answer = sorted[(n - 1) / 2];
    const mean = values.reduce((a, b) => a + b, 0) / n;
    return numeric({
      statement: `A tabela mostra quantos minutos ${n} estudantes levaram para resolver um exercício.`,
      table: { caption: "Tempo para resolver o exercício (minutos)", headers: ["Estudante", "Tempo"], rows: people.map((p, i) => [p, String(values[i])]) },
      prompt: "Qual é a mediana dos tempos?",
      answer,
      unit: "minutos",
      difficulty: "media",
      reasoning: [`Em ordem: ${sorted.join(", ")}`, `São ${n} valores: o do meio é o ${(n + 1) / 2}º`, `Mediana: ${answer} minutos`],
      explanation: "A mediana é o valor do meio quando os dados estão em ordem.",
      mistakes: Number.isInteger(clean(mean))
        ? [{ value: clean(mean), explanation: `${fmt(mean)} é a média. A mediana é o valor do meio, com os dados em ordem.` }]
        : [],
    });
  },
};

/* ------------------------------------------------------------------ */
/* Técnicas de cálculo rápido                                          */
/* ------------------------------------------------------------------ */

function techniqueTwin(
  id: string,
  techniqueId: string,
  name: string,
  sourceIds: string[],
  intro: string,
  mistake?: (ops: number[]) => { value: number; explanation: string } | null,
): TwinGenerator {
  return {
    id,
    topicId: "tecnicas-de-calculo",
    name,
    sourceIds,
    build: (r) => {
      const algorithm = getAlgorithm(techniqueId)!;
      const ops = algorithm.generate(r);
      const solution = algorithm.solve(ops);
      const m = mistake?.(ops);
      return numeric({
        statement: intro,
        prompt: `Quanto é ${algorithm.format(ops)}?`,
        answer: solution.answer,
        difficulty: "facil",
        reasoning: solution.steps,
        explanation: "Confira com a conta tradicional se quiser: o resultado é o mesmo.",
        mistakes: m ? [m] : [],
      });
    },
  };
}

const twinVezes11 = techniqueTwin(
  "tecnica-vezes-11",
  "vezes-11",
  "Vezes 11 de cabeça",
  ["tc-001"],
  "Para multiplicar um número de dois algarismos por 11, some os algarismos e coloque o resultado no meio.",
  ([n]) => {
    const [a, b] = String(n).split("").map(Number);
    if (a + b < 10) return null;
    const value = Number(`${a}${a + b}${b}`);
    return { value, explanation: `${value.toLocaleString("pt-BR")} escreve a soma ${a + b} inteira no meio. Só o algarismo das unidades fica; o 1 vai para a frente.` };
  },
);

const twinQuadrado5 = techniqueTwin(
  "tecnica-quadrado-5",
  "quadrado-final-5",
  "Quadrado de número terminado em 5",
  ["tc-002"],
  "Para elevar ao quadrado um número terminado em 5, multiplique o que vem antes do 5 pelo número seguinte e escreva 25 no final.",
  ([n]) => {
    const front = (n - 5) / 10;
    return { value: front * front * 100 + 25, explanation: `Esse valor usa ${front} × ${front}. O truque multiplica pelo número seguinte: ${front} × ${front + 1}.` };
  },
);

const twinPorcentagemInvertida = techniqueTwin(
  "tecnica-porcentagem-invertida",
  "porcentagem-invertida",
  "Porcentagem invertida",
  ["tc-004"],
  "Lembre: x% de y é igual a y% de x. Escolha o lado mais fácil.",
);

const twinArredondar = techniqueTwin(
  "tecnica-arredondar",
  "arredondar-e-compensar",
  "Arredondar e compensar",
  ["tc-003"],
  "Arredonde o número para a dezena de cima, multiplique e depois tire o que sobrou.",
  ([a, b]) => {
    const round = Math.ceil(a / 10) * 10;
    return { value: round * b + (round - a) * b, explanation: "Esse valor soma a compensação. Como o número foi arredondado para cima, é preciso tirar." };
  },
);

/* ------------------------------------------------------------------ */

export const TWIN_GENERATORS: TwinGenerator[] = [
  aumentoDesconto,
  porcentagemDe,
  variacaoPercentual,
  percentuaisSucessivos,
  precoFinal,
  receita,
  escala,
  divisaoProporcional,
  regraInversa,
  regraDireta,
  funcaoCusto,
  raiz,
  taxaVariacao,
  media,
  notaQueFalta,
  mediana,
  twinVezes11,
  twinQuadrado5,
  twinPorcentagemInvertida,
  twinArredondar,
];

export function twinId(generatorId: string, seed: number): string {
  return `${TWIN_PREFIX}${generatorId}:${seed}`;
}

export function isTwinId(id: string): boolean {
  return id.startsWith(TWIN_PREFIX);
}

export function getTwinGenerator(id: string): TwinGenerator | undefined {
  return TWIN_GENERATORS.find((g) => g.id === id);
}

/** Gera a questão gêmea de uma semente. Sempre a mesma para a mesma semente. */
export function makeTwin(generatorId: string, seed: number): Question | undefined {
  const generator = getTwinGenerator(generatorId);
  if (!generator) return undefined;
  const body = generator.build(seededRandom(seed));
  return { ...body, id: twinId(generatorId, seed), topicId: generator.topicId, source: TWIN_SOURCE } as Question;
}

/** Lê "gemea:molde:semente" e gera a questão. */
export function resolveTwin(id: string): Question | undefined {
  if (!isTwinId(id)) return undefined;
  const [generatorId, seedText] = id.slice(TWIN_PREFIX.length).split(":");
  const seed = Number(seedText);
  if (!Number.isInteger(seed)) return undefined;
  return makeTwin(generatorId, seed);
}

/** Uma semente nova, para pedir outra questão gêmea. */
export function randomSeed(): number {
  return 1 + Math.floor(Math.random() * 2_000_000_000);
}

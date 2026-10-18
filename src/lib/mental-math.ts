/**
 * Técnicas de cálculo rápido: a parte que faz conta.
 *
 * Cada técnica sabe:
 * - gerar um problema adequado para ela (`generate`);
 * - dizer se aceita os números digitados pelo estudante (`check`);
 * - resolver passo a passo, do jeito da técnica (`solve`).
 *
 * O resultado de `solve` é calculado PELA TÉCNICA, não por `a * b`.
 * Os testes conferem que a técnica chega sempre ao mesmo número que a
 * conta tradicional, para milhares de casos. Os textos (nome, origem,
 * por que funciona) ficam em `src/content/data/tecnicas.json`.
 */

export interface MentalProblem {
  operands: number[];
}

export interface Solution {
  steps: string[];
  answer: number;
}

/** Componentes visuais extras que a técnica pode mostrar. */
export type TechniqueVisual = "linhas";

export interface TechniqueAlgorithm {
  id: string;
  /** Nomes dos campos para o estudante digitar os próprios números. */
  inputs: string[];
  /** Exemplo fixo mostrado ao abrir a técnica. */
  example: number[];
  /** Como o problema aparece, ex.: "74 × 11". */
  format: (operands: number[]) => string;
  /** `null` se os números servem para a técnica; senão, o motivo. */
  check: (operands: number[]) => string | null;
  solve: (operands: number[]) => Solution;
  generate: (random: () => number) => number[];
  visual?: TechniqueVisual;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => n.toLocaleString("pt-BR");

function randInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function digitsOf(n: number): number[] {
  return String(Math.abs(n)).split("").map(Number);
}

function isInt(n: number): boolean {
  return Number.isInteger(n);
}

/** Junta pedaços "decimais" com vai-um: [2, 13, 6] → 2·100 + 13·10 + 6 = 436. */
function combinePlaces(places: number[]): number {
  return places.reduce((acc, value) => acc * 10 + value, 0);
}

/* ------------------------------------------------------------------ */
/* As técnicas                                                         */
/* ------------------------------------------------------------------ */

const vezes11: TechniqueAlgorithm = {
  id: "vezes-11",
  inputs: ["Número de 2 algarismos"],
  example: [63],
  format: ([n]) => `${n} × 11`,
  check: ([n]) => (isInt(n) && n >= 10 && n <= 99 ? null : "Use um número de 10 a 99."),
  generate: (r) => [randInt(r, 12, 98)],
  solve: ([n]) => {
    const [a, b] = digitsOf(n);
    const middle = a + b;
    const steps = [`Separe os algarismos de ${n}: ${a} e ${b}.`, `Some os dois: ${a} + ${b} = ${middle}.`];
    if (middle < 10) {
      const answer = combinePlaces([a, middle, b]);
      steps.push(`Coloque a soma no meio: ${a} | ${middle} | ${b} → ${fmt(answer)}.`);
      return { steps, answer };
    }
    const answer = combinePlaces([a + 1, middle - 10, b]);
    steps.push(
      `A soma passou de 9: o ${middle - 10} fica no meio e o 1 "vai" para a frente.`,
      `${a} + 1 = ${a + 1}, então: ${a + 1} | ${middle - 10} | ${b} → ${fmt(answer)}.`,
    );
    return { steps, answer };
  },
};

const quadradoFinal5: TechniqueAlgorithm = {
  id: "quadrado-final-5",
  inputs: ["Número terminado em 5"],
  example: [35],
  format: ([n]) => `${n}²`,
  check: ([n]) =>
    isInt(n) && n >= 15 && n <= 995 && n % 10 === 5 ? null : "Use um número terminado em 5, de 15 a 995.",
  // De 15 a 195: 19 opções, o suficiente para um treino de 10 contas sem repetir.
  generate: (r) => [randInt(r, 1, 19) * 10 + 5],
  solve: ([n]) => {
    const front = (n - 5) / 10;
    const product = front * (front + 1);
    const answer = product * 100 + 25;
    return {
      steps: [
        `Pegue o que vem antes do 5: ${front}.`,
        `Multiplique pelo número seguinte: ${front} × ${front + 1} = ${fmt(product)}.`,
        `Escreva 25 no final: ${fmt(product)} | 25 → ${fmt(answer)}.`,
      ],
      answer,
    };
  },
};

const vezes5: TechniqueAlgorithm = {
  id: "vezes-5",
  inputs: ["Número"],
  example: [468],
  format: ([n]) => `${fmt(n)} × 5`,
  check: ([n]) => (isInt(n) && n >= 2 && n <= 99999 ? null : "Use um número inteiro de 2 a 99.999."),
  generate: (r) => [randInt(r, 24, 998)],
  solve: ([n]) => {
    const times10 = n * 10;
    const answer = times10 / 2;
    return {
      steps: [
        `Multiplicar por 5 é o mesmo que multiplicar por 10 e dividir por 2.`,
        `${fmt(n)} × 10 = ${fmt(times10)} (é só acrescentar um zero).`,
        `Metade de ${fmt(times10)}: ${fmt(answer)}.`,
      ],
      answer,
    };
  },
};

const pertoDe100: TechniqueAlgorithm = {
  id: "perto-de-100",
  inputs: ["Primeiro número (91 a 99)", "Segundo número (91 a 99)"],
  example: [97, 96],
  format: ([a, b]) => `${a} × ${b}`,
  check: ([a, b]) =>
    [a, b].every((n) => isInt(n) && n >= 90 && n <= 99) ? null : "Use dois números de 90 a 99.",
  generate: (r) => [randInt(r, 91, 99), randInt(r, 91, 99)],
  solve: ([a, b]) => {
    const da = 100 - a;
    const db = 100 - b;
    const left = a - db;
    const right = da * db;
    const answer = left * 100 + right;
    return {
      steps: [
        `Quanto falta para 100: ${a} → ${da}, ${b} → ${db}.`,
        `Tire de um número a falta do outro: ${a} − ${db} = ${left} (ou ${b} − ${da}, dá o mesmo).`,
        `Multiplique as faltas: ${da} × ${db} = ${right}. Use sempre 2 algarismos: ${String(right).padStart(2, "0")}.`,
        `Junte as duas partes: ${left} | ${String(right).padStart(2, "0")} → ${fmt(answer)}.`,
      ],
      answer,
    };
  },
};

const diferencaDeQuadrados: TechniqueAlgorithm = {
  id: "diferenca-de-quadrados",
  inputs: ["Primeiro número", "Segundo número"],
  example: [47, 53],
  format: ([a, b]) => `${a} × ${b}`,
  check: ([a, b]) => {
    if (![a, b].every((n) => isInt(n) && n > 0 && n < 1000)) return "Use números inteiros menores que 1.000.";
    if ((a + b) % 2 !== 0) return "Os dois números precisam ter um meio exato: a soma deles deve ser par.";
    if (((a + b) / 2) % 10 !== 0) return "Funciona melhor quando o meio é uma dezena redonda, como 50 ou 70.";
    return null;
  },
  generate: (r) => {
    const middle = randInt(r, 2, 9) * 10;
    const d = randInt(r, 1, 6);
    return [middle - d, middle + d];
  },
  solve: ([a, b]) => {
    const m = (a + b) / 2;
    const d = Math.abs(b - m);
    const square = m * m;
    const answer = square - d * d;
    return {
      steps: [
        `Os números ficam à mesma distância de ${m}: ${m} − ${d} e ${m} + ${d}.`,
        `Calcule ${m}² = ${fmt(square)}.`,
        `Calcule ${d}² = ${d * d}.`,
        `Subtraia: ${fmt(square)} − ${d * d} = ${fmt(answer)}.`,
      ],
      answer,
    };
  },
};

/** Como achar cada porcentagem "fácil" de cabeça. */
const EASY_PERCENT: Record<number, string> = {
  10: "dividir por 10",
  20: "dividir por 5",
  25: "dividir por 4",
  50: "dividir por 2",
};

const porcentagemInvertida: TechniqueAlgorithm = {
  id: "porcentagem-invertida",
  inputs: ["Porcentagem (x%)", "Valor"],
  example: [8, 25],
  format: ([p, v]) => `${p}% de ${v}`,
  check: ([p, v]) => {
    if (![p, v].every((n) => isInt(n) && n > 0 && n <= 1000)) return "Use números inteiros de 1 a 1.000.";
    if (!(v in EASY_PERCENT)) return "O truque brilha quando o valor é 10, 20, 25 ou 50.";
    if ((p * v) % 100 !== 0) return "Escolha números que deem resultado inteiro, como 8% de 25.";
    return null;
  },
  generate: (r) => {
    const v = [10, 20, 25, 50][randInt(r, 0, 3)];
    const step = 100 / v; // p precisa ser múltiplo disso para dar inteiro
    const p = step * randInt(r, Math.ceil(3 / step), Math.floor(96 / step));
    return [p, v];
  },
  solve: ([p, v]) => {
    // Divisão por inteiro (10, 5, 4 ou 2) evita erros de arredondamento do computador.
    const answer = p / (100 / v);
    return {
      steps: [
        `${p}% de ${v} é o mesmo que ${v}% de ${p}: os dois são ${p} × ${v} ÷ 100.`,
        `${v}% é fácil: é ${EASY_PERCENT[v]}.`,
        `${v}% de ${p} = ${p} ÷ ${100 / v} = ${fmt(answer)}.`,
      ],
      answer,
    };
  },
};

const linhas: TechniqueAlgorithm = {
  id: "linhas",
  inputs: ["Primeiro número", "Segundo número"],
  example: [23, 12],
  format: ([a, b]) => `${a} × ${b}`,
  check: ([a, b]) =>
    [a, b].every((n) => isInt(n) && n >= 11 && n <= 99 && digitsOf(n).every((d) => d >= 1 && d <= 5))
      ? null
      : "Para desenhar, use números de 2 algarismos com dígitos de 1 a 5, como 23 e 12.",
  generate: (r) => {
    const two = () => randInt(r, 1, 4) * 10 + randInt(r, 1, 4);
    return [two(), two()];
  },
  solve: ([a, b]) => {
    const [at, au] = digitsOf(a);
    const [bt, bu] = digitsOf(b);
    const left = at * bt;
    const middle = at * bu + au * bt;
    const right = au * bu;
    const answer = combinePlaces([left, middle, right]);
    const steps = [
      `Desenhe ${at} linha(s) e depois ${au} linha(s) para ${a}; cruze com ${bt} e ${bu} linha(s) para ${b}.`,
      `Grupo da esquerda (centenas): ${at} × ${bt} = ${left} cruzamentos.`,
      `Grupos do meio (dezenas): ${at} × ${bu} + ${au} × ${bt} = ${middle} cruzamentos.`,
      `Grupo da direita (unidades): ${au} × ${bu} = ${right} cruzamentos.`,
    ];
    if (middle >= 10 || right >= 10) {
      steps.push(
        `Quando um grupo passa de 9, o algarismo da frente "vai um" para o grupo da esquerda: ${left}·100 + ${middle}·10 + ${right} = ${fmt(answer)}.`,
      );
    } else {
      steps.push(`Leia os grupos em ordem: ${left} | ${middle} | ${right} → ${fmt(answer)}.`);
    }
    return { steps, answer };
  },
  visual: "linhas",
};

/** Soma dos algarismos repetida até sobrar um só, com 9 virando 0. */
export function castOutNines(n: number): number {
  return Math.abs(n) % 9;
}

const novesFora: TechniqueAlgorithm = {
  id: "noves-fora",
  inputs: ["Número"],
  example: [4738],
  format: ([n]) => `noves fora de ${fmt(n)}`,
  check: ([n]) => (isInt(n) && n >= 10 && n <= 9_999_999 ? null : "Use um número inteiro de 10 a 9.999.999."),
  generate: (r) => [randInt(r, 100, 99999)],
  solve: ([n]) => {
    const steps: string[] = [];
    let current = n;
    while (current >= 10) {
      const ds = digitsOf(current);
      const sum = ds.reduce((s, d) => s + d, 0);
      steps.push(`Some os algarismos de ${fmt(current)}: ${ds.join(" + ")} = ${sum}.`);
      current = sum;
    }
    const answer = current === 9 ? 0 : current;
    steps.push(
      current === 9
        ? `Sobrou 9, e 9 "fora" é 0. Resposta: 0.`
        : `Sobrou um algarismo só: ${answer}. Esse é o "noves fora".`,
    );
    return { steps, answer };
  },
};

const arredondarECompensar: TechniqueAlgorithm = {
  id: "arredondar-e-compensar",
  inputs: ["Número terminado em 7, 8 ou 9", "Multiplicador (2 a 9)"],
  example: [49, 6],
  format: ([a, b]) => `${a} × ${b}`,
  check: ([a, b]) => {
    if (!isInt(a) || a < 17 || a > 999 || ![7, 8, 9].includes(a % 10))
      return "Use um número de 17 a 999 terminado em 7, 8 ou 9.";
    if (!isInt(b) || b < 2 || b > 9) return "Use um multiplicador de 2 a 9.";
    return null;
  },
  generate: (r) => [randInt(r, 2, 19) * 10 - randInt(r, 1, 3), randInt(r, 3, 9)],
  solve: ([a, b]) => {
    const round = Math.ceil(a / 10) * 10;
    const gap = round - a;
    const big = round * b;
    const extra = gap * b;
    const answer = big - extra;
    return {
      steps: [
        `Arredonde para cima: ${a} = ${round} − ${gap}.`,
        `Multiplique o número redondo: ${round} × ${b} = ${fmt(big)}.`,
        `Calcule o que sobrou: ${gap} × ${b} = ${extra}.`,
        `Tire o que sobrou: ${fmt(big)} − ${extra} = ${fmt(answer)}.`,
      ],
      answer,
    };
  },
};

const dobrarEDividir: TechniqueAlgorithm = {
  id: "dobrar-e-dividir",
  inputs: ["Número par", "25 ou 50"],
  example: [16, 25],
  format: ([a, b]) => `${a} × ${b}`,
  check: ([a, b]) => {
    if (b !== 25 && b !== 50) return "O segundo número deve ser 25 ou 50.";
    const need = b === 25 ? 4 : 2;
    if (!isInt(a) || a < need || a > 9996 || a % need !== 0)
      return b === 25 ? "Com 25, use um múltiplo de 4, como 16 ou 36." : "Com 50, use um número par.";
    return null;
  },
  generate: (r) => {
    const b = r() < 0.5 ? 25 : 50;
    return [b === 25 ? randInt(r, 2, 40) * 4 : randInt(r, 3, 60) * 2, b];
  },
  solve: ([a, b]) => {
    const steps: string[] = [];
    let x = a;
    let y = b;
    while (y < 100) {
      steps.push(`Metade de ${fmt(x)} e dobro de ${y}: ${fmt(x / 2)} × ${y * 2}.`);
      x = x / 2;
      y = y * 2;
    }
    const answer = x * 100;
    steps.push(`Multiplicar por 100 é acrescentar dois zeros: ${fmt(x)} × 100 = ${fmt(answer)}.`);
    return { steps, answer };
  },
};

export const TECHNIQUE_ALGORITHMS: TechniqueAlgorithm[] = [
  linhas,
  vezes11,
  quadradoFinal5,
  vezes5,
  dobrarEDividir,
  arredondarECompensar,
  diferencaDeQuadrados,
  pertoDe100,
  porcentagemInvertida,
  novesFora,
];

export function getAlgorithm(id: string): TechniqueAlgorithm | undefined {
  return TECHNIQUE_ALGORITHMS.find((t) => t.id === id);
}

/** Resposta pela conta tradicional, para conferir as técnicas. */
export function directAnswer(id: string, operands: number[]): number {
  const [a, b] = operands;
  switch (id) {
    case "quadrado-final-5":
      return a * a;
    case "vezes-11":
      return a * 11;
    case "vezes-5":
      return a * 5;
    case "porcentagem-invertida":
      return (a * b) / 100;
    case "noves-fora":
      return castOutNines(a);
    default:
      return a * b;
  }
}

/** Contas do treino: problemas novos a cada rodada, sem repetir seguidos. */
export function buildDrill(algorithm: TechniqueAlgorithm, count: number, random: () => number = Math.random) {
  const problems: number[][] = [];
  let guard = 0;
  while (problems.length < count && guard < count * 50) {
    guard += 1;
    const ops = algorithm.generate(random);
    const key = ops.join(",");
    if (problems.some((p) => p.join(",") === key)) continue;
    if (algorithm.check(ops) !== null) continue;
    problems.push(ops);
  }
  return problems;
}

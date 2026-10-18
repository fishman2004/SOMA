/**
 * Cartão-resposta para provas oficiais.
 *
 * O SOMA não copia as provas do ENEM: o estudante faz a prova pelo site do
 * INEP, marca as respostas aqui e cola o gabarito oficial. Esta parte lê o
 * gabarito colado e corrige.
 */

export const LETTERS = ["A", "B", "C", "D", "E"] as const;
export type Letter = (typeof LETTERS)[number];

/** Item do gabarito: uma letra, ou "anulada" (questão anulada pelo INEP). */
export type KeyItem = Letter | "anulada";

/**
 * Lê um gabarito colado do PDF ou digitado. Aceita formatos como
 * "ACEBD...", "1 A 2 C 3 E", "1-A; 2-C" ou uma letra por linha.
 * Números são ignorados. "X", "*" ou "anulada" marcam questão anulada.
 */
export function parseAnswerKey(text: string): KeyItem[] {
  const normalized = text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira acentos
    .replace(/ANULAD[AO]/g, " * ");
  const items: KeyItem[] = [];
  // Cada pedaço é uma sequência de letras A–E, ou um marcador de anulada.
  for (const token of normalized.match(/[A-Z]+|\*/g) ?? []) {
    if (token === "*" || token === "X") {
      items.push("anulada");
    } else if (/^[A-E]+$/.test(token)) {
      for (const letter of token) items.push(letter as Letter);
    }
    // Outras palavras (ex.: "GABARITO", "QUESTAO") são ignoradas.
  }
  return items;
}

export interface SheetResult {
  /** Questões válidas (sem as anuladas). */
  total: number;
  correct: number;
  wrong: number[];
  blank: number[];
  annulled: number[];
}

/**
 * Corrige o cartão. `answers[i]` é a resposta da questão `first + i`
 * (null = em branco). Questões anuladas, ou sem gabarito, não contam.
 */
export function gradeSheet(answers: (Letter | null)[], key: KeyItem[], first = 1): SheetResult {
  const result: SheetResult = { total: 0, correct: 0, wrong: [], blank: [], annulled: [] };
  answers.forEach((given, i) => {
    const number = first + i;
    const expected = key[i];
    if (expected === undefined) return; // sem gabarito para esta questão
    if (expected === "anulada") {
      result.annulled.push(number);
      return;
    }
    result.total += 1;
    if (given === null) result.blank.push(number);
    else if (given === expected) result.correct += 1;
    else result.wrong.push(number);
  });
  return result;
}

/** Junta números seguidos em faixas: [3, 4, 5, 9] → "3–5, 9". */
export function formatRanges(numbers: number[]): string {
  const sorted = [...numbers].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    if (start !== undefined) parts.push(start === prev ? String(start) : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  return parts.join(", ");
}

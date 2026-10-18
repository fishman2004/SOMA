import { describe, expect, it } from "vitest";
import { formatRanges, gradeSheet, parseAnswerKey } from "./answer-sheet";

describe("leitura do gabarito", () => {
  it.each([
    ["ACEBD", ["A", "C", "E", "B", "D"]],
    ["1 A 2 C 3 E", ["A", "C", "E"]],
    ["1-a; 2-c; 3-e", ["A", "C", "E"]],
    ["Questão 91: B\nQuestão 92: D", ["B", "D"]],
    ["1 A\n2 ANULADA\n3 C", ["A", "anulada", "C"]],
    ["A X C *", ["A", "anulada", "C", "anulada"]],
    ["GABARITO: ab cd", ["A", "B", "C", "D"]],
  ])("lê %j", (text, expected) => {
    expect(parseAnswerKey(text)).toEqual(expected);
  });
});

describe("correção", () => {
  it("conta acertos, erros, brancos e anuladas", () => {
    const result = gradeSheet(["A", "B", null, "D", "E"], ["A", "C", "C", "anulada", "E"], 91);
    expect(result).toEqual({ total: 4, correct: 2, wrong: [92], blank: [93], annulled: [94] });
  });

  it("gabarito mais curto deixa as questões finais de fora da correção", () => {
    const result = gradeSheet(["A", "B", "C"], ["A", "B"]);
    expect(result.total).toBe(2);
    expect(result.correct).toBe(2);
    expect(result.wrong).toEqual([]);
  });
});

describe("faixas de números", () => {
  it("agrupa números seguidos", () => {
    expect(formatRanges([9, 3, 4, 5, 12, 13])).toBe("3–5, 9, 12–13");
    expect(formatRanges([7])).toBe("7");
    expect(formatRanges([])).toBe("");
  });
});

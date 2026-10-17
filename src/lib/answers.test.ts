import { describe, expect, it } from "vitest";
import { getQuestion, type Question } from "@/content";
import { correctAnswerText, givenAnswerText, isAnswerCorrect, mistakeExplanation } from "./answers";

const mc = getQuestion("porc-001") as Question;
const num = getQuestion("porc-005") as Question;

describe("múltipla escolha", () => {
  it("confere pela letra", () => {
    expect(isAnswerCorrect(mc, "B")).toBe(true);
    expect(isAnswerCorrect(mc, "A")).toBe(false);
  });

  it("mostra letra e texto", () => {
    expect(correctAnswerText(mc)).toBe("B) R$ 80,00");
    expect(givenAnswerText(mc, "A")).toBe("A) R$ 84,00");
  });

  it("explica a armadilha só quando ela foi escolhida", () => {
    expect(mistakeExplanation(mc, "A")).toContain("multiplicam");
    expect(mistakeExplanation(mc, "C")).toBeUndefined();
  });
});

describe("resposta numérica", () => {
  it("aceita formatos diferentes do mesmo número", () => {
    expect(isAnswerCorrect(num, "1020")).toBe(true);
    expect(isAnswerCorrect(num, "1.020,00")).toBe(true);
    expect(isAnswerCorrect(num, "R$ 1020")).toBe(true);
    expect(isAnswerCorrect(num, "1080")).toBe(false);
    expect(isAnswerCorrect(num, "abc")).toBe(false);
  });

  it("mostra com prefixo e unidade", () => {
    expect(correctAnswerText(num)).toBe("R$ 1.020,00");
    expect(givenAnswerText(num, "180")).toBe("R$ 180,00");
  });

  it("reconhece erros previstos", () => {
    expect(mistakeExplanation(num, "180")).toContain("desconto");
    expect(mistakeExplanation(num, "999")).toBeUndefined();
  });
});

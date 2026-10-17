import { describe, expect, it } from "vitest";
import { formatNumber, formatWithUnit, isNumericAnswerCorrect, parseNumber } from "./numeric-answer";

describe("leitura de números digitados", () => {
  it.each([
    ["80", 80],
    ["80,00", 80],
    ["R$ 80,00", 80],
    ["12,5", 12.5],
    ["12.5", 12.5],
    ["1.250", 1250],
    ["1.250,75", 1250.75],
    ["1,250.75", 1250.75],
    ["1.000.000", 1000000],
    ["25%", 25],
    ["-4", -4],
    ["−4", -4],
    ["  5 m ", 5],
    ["0,5", 0.5],
    [",5", 0.5],
  ])("lê %s como %d", (input, expected) => {
    expect(parseNumber(input)).toBe(expected);
  });

  it.each(["", "abc", "R$", "1,2,3", "1.2.3", "--"])("rejeita %j", (input) => {
    expect(parseNumber(input)).toBeNull();
  });
});

describe("conferência", () => {
  it("aceita dentro da tolerância e recusa fora dela", () => {
    expect(isNumericAnswerCorrect(1020, 1020)).toBe(true);
    expect(isNumericAnswerCorrect(157.49, 157.5, 0.01)).toBe(true);
    expect(isNumericAnswerCorrect(157.4, 157.5, 0.01)).toBe(false);
  });

  it("não sofre com erros de arredondamento do computador", () => {
    expect(isNumericAnswerCorrect(0.1 + 0.2, 0.3)).toBe(true);
  });
});

describe("formatação", () => {
  it("escreve no padrão brasileiro", () => {
    expect(formatNumber(1250.5)).toBe("1.250,5");
    expect(formatWithUnit(1020, "R$")).toBe("R$ 1.020,00");
    expect(formatWithUnit(5, undefined, "m")).toBe("5 m");
  });
});

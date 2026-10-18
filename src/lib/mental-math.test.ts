import { describe, expect, it } from "vitest";
import { seededRandom } from "./exam";
import { buildDrill, castOutNines, directAnswer, getAlgorithm, TECHNIQUE_ALGORITHMS } from "./mental-math";

/**
 * A garantia principal: cada técnica, seguida passo a passo, chega ao
 * mesmo resultado da conta tradicional. Testamos milhares de casos
 * sorteados e os exemplos fixos.
 */
describe.each(TECHNIQUE_ALGORITHMS.map((t) => [t.id, t] as const))("técnica %s", (_id, t) => {
  it("o exemplo fixo é válido e dá a resposta certa", () => {
    expect(t.check(t.example)).toBeNull();
    expect(t.solve(t.example).answer).toBe(directAnswer(t.id, t.example));
  });

  it("acerta em 2.000 problemas sorteados", () => {
    const random = seededRandom(42);
    for (let i = 0; i < 2000; i++) {
      const ops = t.generate(random);
      expect(t.check(ops), `gerou números inválidos: ${ops}`).toBeNull();
      const { answer, steps } = t.solve(ops);
      expect(answer, `${t.format(ops)}`).toBe(directAnswer(t.id, ops));
      expect(steps.length).toBeGreaterThan(1);
    }
  });

  it("o último passo mostra a resposta", () => {
    const { answer, steps } = t.solve(t.example);
    expect(steps[steps.length - 1]).toContain(answer.toLocaleString("pt-BR"));
  });
});

describe("casos que pedem atenção", () => {
  it("×11 com vai-um: 78 × 11 = 858", () => {
    expect(getAlgorithm("vezes-11")!.solve([78]).answer).toBe(858);
  });

  it("perto de 100 com falta pequena: 98 × 99 = 9.702", () => {
    const { answer, steps } = getAlgorithm("perto-de-100")!.solve([98, 99]);
    expect(answer).toBe(9702);
    expect(steps.join(" ")).toContain("02");
  });

  it("linhas com vai-um: 45 × 35 = 1.575", () => {
    expect(getAlgorithm("linhas")!.solve([45, 35]).answer).toBe(1575);
  });

  it("todos os pares válidos do método das linhas", () => {
    const t = getAlgorithm("linhas")!;
    for (let a = 11; a <= 55; a++) {
      for (let b = 11; b <= 55; b++) {
        if (t.check([a, b]) !== null) continue;
        expect(t.solve([a, b]).answer).toBe(a * b);
      }
    }
  });

  it("noves fora de múltiplo de 9 é 0", () => {
    expect(getAlgorithm("noves-fora")!.solve([4545]).answer).toBe(0);
    expect(castOutNines(4738)).toBe(4);
  });

  it("recusa números fora do alcance da técnica", () => {
    expect(getAlgorithm("vezes-11")!.check([7])).not.toBeNull();
    expect(getAlgorithm("quadrado-final-5")!.check([34])).not.toBeNull();
    expect(getAlgorithm("linhas")!.check([29, 12])).not.toBeNull();
    expect(getAlgorithm("diferenca-de-quadrados")!.check([47, 52])).not.toBeNull();
    expect(getAlgorithm("dobrar-e-dividir")!.check([18, 25])).not.toBeNull();
    expect(getAlgorithm("porcentagem-invertida")!.check([8, 30])).not.toBeNull();
  });
});

describe("treino", () => {
  it("gera contas diferentes entre si", () => {
    for (const t of TECHNIQUE_ALGORITHMS) {
      const drill = buildDrill(t, 10, seededRandom(7));
      expect(drill).toHaveLength(10);
      expect(new Set(drill.map((p) => p.join(","))).size).toBe(10);
    }
  });
});

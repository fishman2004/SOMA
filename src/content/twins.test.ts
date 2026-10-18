import { describe, expect, it } from "vitest";
import { isAnswerCorrect } from "@/lib/answers";
import { getAllQuestions, getQuestion, getTwinGeneratorFor } from "./index";
import { makeTwin, TWIN_GENERATORS, twinId } from "./twins";
import type { Question } from "./types";

/**
 * Conferência independente: cada oráculo lê os números do TEXTO da questão
 * gerada (como um estudante leria) e refaz a conta do zero. Assim, um erro
 * no gerador não passa despercebido.
 */

const SEEDS = 2500;

/** "R$ 1.234,56" ou "1.234,5" → 1234.56 */
function num(text: string): number {
  return Number(text.replace(/R\$\s?/, "").replace(/\./g, "").replace(",", "."));
}

function all(re: RegExp, text: string): string[] {
  const m = text.match(re);
  if (!m) throw new Error(`não achei ${re} em: ${text}`);
  return m.slice(1);
}

function tableNumbers(q: Question): number[] {
  return q.table!.rows.map((row) => num(row[row.length - 1]));
}

function expectedAnswer(generatorId: string, q: Question): number {
  const t = `${q.statement} ${q.prompt}`;
  switch (generatorId) {
    case "aumento-desconto": {
      const [P, a, d] = all(/custava (R\$ [\d.,]+)\. .*?em (\d+)%.*?desconto de (\d+)%/, t);
      return num(P) * (1 + Number(a) / 100) * (1 - Number(d) / 100);
    }
    case "porcentagem-de": {
      const [N, p] = all(/grupo de (\d+) .*?, (\d+)%/, t);
      return (Number(N) * Number(p)) / 100;
    }
    case "variacao-percentual": {
      const [a, b] = all(/de (R\$ [\d.,]+) para (R\$ [\d.,]+)/, t);
      return (Math.abs(num(b) - num(a)) / num(a)) * 100;
    }
    case "percentuais-sucessivos": {
      const [p1, p2] = all(/primeiro de (\d+)% e depois de (\d+)%/, t).map(Number);
      return t.includes("descontos")
        ? 100 - (100 - p1) * (100 - p2) / 100
        : ((100 + p1) * (100 + p2)) / 100 - 100;
    }
    case "preco-final": {
      if (t.includes("desconto")) {
        const [P, p] = all(/custava (R\$ [\d.,]+) e foi vendido com (\d+)%/, t);
        return num(P) * (1 - Number(p) / 100);
      }
      const [P, p] = all(/que era (R\$ [\d.,]+), teve um aumento de (\d+)%/, t);
      return num(P) * (1 + Number(p) / 100);
    }
    case "receita-proporcional": {
      const [a, b, c] = all(/usa (\d+) .*? para fazer (\d+) .*?para (\d+) /, t).map(Number);
      return (a * c) / b;
    }
    case "escala": {
      const [E, cm] = all(/1 : ([\d.]+)\. .*?de (\d+) cm/, t);
      const realCm = num(E) * Number(cm);
      return t.includes("quilômetros") ? realCm / 100_000 : realCm / 100;
    }
    case "divisao-proporcional": {
      const [T, a, b] = all(/prêmio de (R\$ [\d.,]+) na razão (\d+) para (\d+)/, t);
      return (num(T) * Number(a)) / (Number(a) + Number(b));
    }
    case "regra-de-tres-inversa": {
      const [w1, d1] = all(/^(\d+) .*? em (\d+) /, q.statement).map(Number);
      const [w2] = all(/(\d+) \S+/, q.prompt.replace(/^Em quantos \S+ /, "")).map(Number);
      return (w1 * d1) / w2;
    }
    case "regra-de-tres-direta": {
      const [t1, q1] = all(/^Em (\d+) \S+, .*? (\d+) \S+/, q.statement).map(Number);
      const [q2] = all(/(\d+) \S+\?$/, q.prompt).map(Number);
      return (t1 * q2) / q1;
    }
    case "funcao-custo": {
      const [F, r] = all(/(R\$ [\d.,]+).*?(R\$ [\d.,]+)/, q.statement).map(num);
      const [x] = all(/(\d+) (?:minutos|km|meses)/, q.prompt).map(Number);
      return F + r * x;
    }
    case "raiz": {
      const [a, sign, b] = all(/f\(x\) = (\d+)x ([−+]) (\d+)/, t);
      return ((sign === "−" ? 1 : -1) * Number(b)) / Number(a);
    }
    case "taxa-de-variacao": {
      const [x1, y1, x2, y2] = all(/\((\d+), (-?\d+)\) e \((\d+), (-?\d+)\)/, t).map(Number);
      return (y2 - y1) / (x2 - x1);
    }
    case "media": {
      const values = tableNumbers(q);
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
    case "nota-que-falta": {
      const [m] = all(/média (\d+)\?/, t).map(Number);
      return m * 5 - tableNumbers(q).reduce((a, b) => a + b, 0);
    }
    case "mediana": {
      const sorted = tableNumbers(q).sort((a, b) => a - b);
      return sorted[(sorted.length - 1) / 2];
    }
    default: {
      // Técnicas de cálculo: lê a conta do enunciado.
      const prompt = q.prompt.replace(/^Quanto é /, "").replace(/\?$/, "");
      let m = prompt.match(/^([\d.]+)²$/);
      if (m) return num(m[1]) ** 2;
      m = prompt.match(/^(\d+)% de (\d+)$/);
      if (m) return (Number(m[1]) * Number(m[2])) / 100;
      m = prompt.match(/^([\d.]+) × ([\d.]+)$/);
      if (m) return num(m[1]) * num(m[2]);
      throw new Error(`conta desconhecida: ${prompt}`);
    }
  }
}

function correctValue(q: Question): number {
  if (q.kind === "numerica") return q.answer;
  return num(q.alternatives.find((a) => a.id === q.correctId)!.text);
}

describe.each(TWIN_GENERATORS.map((g) => [g.id, g] as const))("molde %s", (id, g) => {
  it(`gera ${SEEDS} questões certas e bem formadas`, () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const q = makeTwin(id, seed)!;
      const label = `${id} semente ${seed}: ${q.statement} ${q.prompt}`;
      const texts = [q.statement, q.prompt, q.explanation, ...q.reasoning];
      for (const text of texts) {
        expect(text, label).not.toMatch(/NaN|undefined|Infinity|null/);
        expect(text.trim().length, label).toBeGreaterThan(0);
      }

      const expected = expectedAnswer(id, q);
      expect(Math.abs(correctValue(q) - expected), label).toBeLessThan(1e-6);

      if (q.kind === "numerica") {
        // Resposta com no máximo 2 casas decimais, aceita pelo corretor.
        expect(Math.abs(q.answer * 100 - Math.round(q.answer * 100)), label).toBeLessThan(1e-6);
        expect(isAnswerCorrect(q, String(q.answer)), label).toBe(true);
        for (const m of q.commonMistakes ?? []) {
          expect(isAnswerCorrect(q, String(m.value)), `${label} | erro previsto = resposta`).toBe(false);
        }
      } else {
        const texts = q.alternatives.map((a) => a.text);
        expect(new Set(texts).size, label).toBe(5);
        expect(q.trap && q.trap.alternativeId !== q.correctId, label).toBe(true);
      }
    }
  });

  it("a mesma semente gera a mesma questão", () => {
    expect(makeTwin(id, 42)).toEqual(makeTwin(id, 42));
    expect(getQuestion(twinId(id, 42))).toEqual(makeTwin(id, 42));
  });

  it("sementes diferentes variam a questão", () => {
    const versions = new Set(Array.from({ length: 30 }, (_, i) => JSON.stringify({ ...makeTwin(id, i + 1)!, id: "" })));
    expect(versions.size).toBeGreaterThan(5);
  });

  it("aponta só para questões fixas que existem e são do mesmo tópico", () => {
    for (const sourceId of g.sourceIds) {
      const q = getAllQuestions().find((x) => x.id === sourceId);
      expect(q, sourceId).toBeDefined();
      expect(q!.topicId).toBe(g.topicId);
      expect(getTwinGeneratorFor(sourceId)?.id).toBe(id);
    }
  });
});

describe("ids de gêmeas", () => {
  it("ids inválidos não geram questão", () => {
    expect(getQuestion("gemea:nao-existe:1")).toBeUndefined();
    expect(getQuestion("gemea:raiz:abc")).toBeUndefined();
  });

  it("uma gêmea sabe de qual molde veio", () => {
    expect(getTwinGeneratorFor(twinId("raiz", 7))?.id).toBe("raiz");
  });
});

import { describe, expect, it } from "vitest";
import { getAllFlashcards, getAllQuestions, getAllSubjects, getTopic } from "./index";

/**
 * Testes de qualidade do conteúdo. Rodam sempre que alguém altera
 * os arquivos JSON, para pegar erros antes de chegarem ao estudante.
 */
describe("integridade do conteúdo", () => {
  const questions = getAllQuestions();

  it("não repete identificadores de questão", () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cartões têm id único, tópico existente e textos preenchidos", () => {
    const cards = getAllFlashcards();
    expect(cards.length).toBeGreaterThan(0);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    for (const c of cards) {
      expect(getTopic(c.topicId), `${c.id}: tópico inexistente`).toBeDefined();
      expect(c.front.trim().length, `${c.id}: frente vazia`).toBeGreaterThan(0);
      expect(c.back.trim().length, `${c.id}: verso vazio`).toBeGreaterThan(0);
    }
  });

  it("não repete identificadores de tópico", () => {
    const ids = getAllSubjects().flatMap((s) => s.topics.map((t) => t.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(questions.map((q) => [q.id, q] as const))("%s está bem formada", (_id, q) => {
    expect(getTopic(q.topicId), "tópico inexistente").toBeDefined();
    expect(q.source.label.length).toBeGreaterThan(0);
    expect(q.reasoning.length, "sem raciocínio").toBeGreaterThan(0);

    if (q.kind === "numerica") {
      expect(Number.isFinite(q.answer), "resposta não é número").toBe(true);
      for (const m of q.commonMistakes ?? []) {
        expect(Math.abs(m.value - q.answer), "erro comum igual à resposta").toBeGreaterThan(q.tolerance ?? 0);
      }
      return;
    }

    expect(q.kind, "formato desconhecido").toBe("multipla-escolha");
    const letters = q.alternatives.map((a) => a.id);
    expect(new Set(letters).size, "letras repetidas").toBe(letters.length);
    expect(letters, "gabarito fora das alternativas").toContain(q.correctId);
    const texts = q.alternatives.map((a) => a.text);
    expect(new Set(texts).size, "alternativas com o mesmo texto").toBe(texts.length);
    if (q.trap) {
      expect(letters).toContain(q.trap.alternativeId);
      expect(q.trap.alternativeId, "armadilha não pode ser o gabarito").not.toBe(q.correctId);
    }
  });
});

/**
 * Confere as contas de cada gabarito de forma independente do JSON.
 * Ao criar uma questão nova de Matemática, adicione a conta aqui.
 */
describe("contas dos gabaritos", () => {
  /** Texto da alternativa correta, ou o número esperado nas questões numéricas. */
  const answerOf = (id: string) => {
    const q = getAllQuestions().find((x) => x.id === id)!;
    if (q.kind === "numerica") return String(q.answer);
    return q.alternatives.find((a) => a.id === q.correctId)!.text;
  };
  const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  it("porc-001: aumento de 25% seguido de desconto de 20%", () => {
    expect(answerOf("porc-001")).toBe(brl(80 * 1.25 * 0.8));
  });

  it("porc-002: 35% de 40 estudantes", () => {
    expect(answerOf("porc-002")).toBe(String(Math.round(40 * 0.35)));
  });

  it("porc-003: variação de R$ 5,00 para R$ 6,50", () => {
    expect(answerOf("porc-003")).toBe(pct((6.5 - 5) / 5));
  });

  it("porc-004: dois descontos seguidos de 10%", () => {
    expect(answerOf("porc-004")).toBe(pct(1 - 0.9 * 0.9));
  });

  /* Razão e proporção */
  it("rp-001: 2 xícaras para 3 ovos, quantas para 9", () => {
    expect(answerOf("rp-001")).toBe(String((2 / 3) * 9));
  });
  it("rp-002: escala 1:50.000, 4 cm no mapa", () => {
    const km = (4 * 50_000) / 100_000; // cm → km
    expect(answerOf("rp-002")).toBe(`${km} km`);
  });
  it("rp-003: razão 3 para 2 em 300 estudantes", () => {
    expect(answerOf("rp-003")).toBe(String((300 / 5) * 3));
  });
  it("rp-004: 240 km com 20 L, quanto com 35 L", () => {
    expect(answerOf("rp-004")).toBe(`${(240 / 20) * 35} km`);
  });

  /* Regra de três */
  it("r3-001: 3 torneiras em 12 h, 9 torneiras (inversa)", () => {
    expect(answerOf("r3-001")).toBe(`${(3 * 12) / 9} horas`);
  });
  it("r3-002: 5 kg para 400 xícaras, quanto para 1.000 (direta)", () => {
    expect(answerOf("r3-002")).toBe(`${String((5 * 1000) / 400).replace(".", ",")} kg`);
  });
  it("r3-003: 60 km/h em 4 h, tempo a 80 km/h (inversa)", () => {
    expect(answerOf("r3-003")).toBe(`${(60 * 4) / 80} h`);
  });
  it("r3-004: 150 páginas em 6 min, tempo para 400 (direta)", () => {
    expect(answerOf("r3-004")).toBe(`${(6 * 400) / 150} minutos`);
  });

  /* Funções do 1º grau */
  it("f1-001: R$ 30 fixos + R$ 0,50 por minuto, 100 minutos", () => {
    expect(answerOf("f1-001")).toBe(brl(0.5 * 100 + 30));
  });
  it("f1-002: raiz de f(x) = 3x − 12", () => {
    expect(answerOf("f1-002")).toBe(String(12 / 3));
  });
  it("f1-003: vela de 20 cm que mede 14 cm após 3 h", () => {
    const rate = (14 - 20) / (3 - 0);
    expect(rate).toBe(-2);
    expect(answerOf("f1-003")).toBe(`h(t) = 20 − ${Math.abs(rate)}t`);
  });
  it("f1-004: 500 L perdendo 25 L por hora", () => {
    expect(answerOf("f1-004")).toBe(`${500 / 25} horas`);
  });

  /* Leitura de gráficos e tabelas */
  it("gt-001: média de 180, 150, 210 e 90 mm", () => {
    const avg = (180 + 150 + 210 + 90) / 4;
    expect(answerOf("gt-001")).toBe(`${String(avg).replace(".", ",")} mm`);
  });
  it("gt-002: variação de 1.000 para 1.250", () => {
    expect(answerOf("gt-002")).toBe(pct((1250 - 1000) / 1000));
  });
  it("gt-003: 15 − 9 mil litros", () => {
    expect(answerOf("gt-003")).toBe(`${((15 - 9) * 1000).toLocaleString("pt-BR")} litros`);
  });
  /* Questões de resposta numérica */
  it("porc-005: R$ 1.200,00 com 15% de desconto", () => {
    expect(answerOf("porc-005")).toBe(String(1200 * 0.85));
  });
  it("rp-005: 2,5 cm na escala 1:200, em metros", () => {
    expect(answerOf("rp-005")).toBe(String((2.5 * 200) / 100));
  });
  it("r3-005: 8 operários em 15 dias, 12 operários (inversa)", () => {
    expect(answerOf("r3-005")).toBe(String((8 * 15) / 12));
  });
  it("f1-005: R$ 80 de matrícula + R$ 60 por mês, 6 meses", () => {
    expect(answerOf("f1-005")).toBe(String(60 * 6 + 80));
  });
  it("gt-005: média de 320, 480 e 400 ingressos", () => {
    expect(answerOf("gt-005")).toBe(String((320 + 480 + 400) / 3));
  });

  it("gt-004: maior taxa entre 18/24, 21/30 e 27/40", () => {
    const rates = { A: 18 / 24, B: 21 / 30, C: 27 / 40 };
    const best = Object.entries(rates).sort((x, y) => y[1] - x[1])[0][0];
    expect(answerOf("gt-004")).toBe(`Turma ${best}`);
  });
});

/** Toda questão do conteúdo precisa ter a conta conferida acima. */
describe("cobertura das contas", () => {
  it("cada questão tem um teste de gabarito", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL(import.meta.url), "utf8");
    const missing = getAllQuestions()
      .map((q) => q.id)
      .filter((id) => !source.includes(`answerOf("${id}")`));
    expect(missing).toEqual([]);
  });
});

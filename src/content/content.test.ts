import { describe, expect, it } from "vitest";
import { getAllQuestions, getAllSubjects, getTopic } from "./index";

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

  it("não repete identificadores de tópico", () => {
    const ids = getAllSubjects().flatMap((s) => s.topics.map((t) => t.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(questions.map((q) => [q.id, q] as const))("%s está bem formada", (_id, q) => {
    expect(getTopic(q.topicId), "tópico inexistente").toBeDefined();
    const letters = q.alternatives.map((a) => a.id);
    expect(new Set(letters).size, "letras repetidas").toBe(letters.length);
    expect(letters, "gabarito fora das alternativas").toContain(q.correctId);
    const texts = q.alternatives.map((a) => a.text);
    expect(new Set(texts).size, "alternativas com o mesmo texto").toBe(texts.length);
    if (q.trap) {
      expect(letters).toContain(q.trap.alternativeId);
      expect(q.trap.alternativeId, "armadilha não pode ser o gabarito").not.toBe(q.correctId);
    }
    expect(q.source.label.length).toBeGreaterThan(0);
  });
});

/**
 * Confere as contas de cada gabarito de forma independente do JSON.
 * Ao criar uma questão nova de Matemática, adicione a conta aqui.
 */
describe("contas dos gabaritos", () => {
  const answerOf = (id: string) => {
    const q = getAllQuestions().find((x) => x.id === id)!;
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
});

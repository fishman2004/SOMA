import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, getXp, markTopicVisited, recordAttempt, type ProgressState } from "./learning";
import {
  countLearnedCards,
  describeInterval,
  getReviewQueue,
  NEW_CARDS_PER_DAY,
  previewSchedule,
  reviewCard,
} from "./spaced-repetition";

// Sábado, 17/10/2026, 15h no horário local.
const NOW = new Date(2026, 9, 17, 15, 0);
const day = (offset: number) => new Date(2026, 9, 17 + offset, 0, 0);

describe("agenda de um cartão", () => {
  it("cartão novo marcado como fácil vai para a caixa 2 e volta em 3 dias", () => {
    const s = reviewCard(EMPTY_PROGRESS, "c1", "facil", NOW);
    expect(s.cards.c1.box).toBe(2);
    expect(new Date(s.cards.c1.dueAt)).toEqual(day(3));
  });

  it("cartão novo marcado como difícil fica na caixa 1 e volta amanhã", () => {
    const s = reviewCard(EMPTY_PROGRESS, "c1", "dificil", NOW);
    expect(s.cards.c1.box).toBe(1);
    expect(new Date(s.cards.c1.dueAt)).toEqual(day(1));
  });

  it("errar volta para a caixa 1 e repete na mesma sessão", () => {
    let s = reviewCard(EMPTY_PROGRESS, "c1", "facil", NOW);
    s = reviewCard(s, "c1", "facil", NOW);
    expect(s.cards.c1.box).toBe(3);
    s = reviewCard(s, "c1", "errei", NOW);
    expect(s.cards.c1.box).toBe(1);
    expect(s.cards.c1.lapses).toBe(1);
    expect(new Date(s.cards.c1.dueAt).getTime() - NOW.getTime()).toBe(10 * 60_000);
  });

  it("não passa da caixa 5", () => {
    let s: ProgressState = EMPTY_PROGRESS;
    for (let i = 0; i < 8; i++) s = reviewCard(s, "c1", "facil", NOW);
    expect(s.cards.c1.box).toBe(5);
    expect(new Date(s.cards.c1.dueAt)).toEqual(day(35));
  });

  it("guarda a data da primeira revisão e conta as revisões", () => {
    const later = new Date(2026, 9, 20, 9, 0);
    let s = reviewCard(EMPTY_PROGRESS, "c1", "facil", NOW);
    s = reviewCard(s, "c1", "dificil", later);
    expect(s.cards.c1.firstReviewedAt).toBe(NOW.toISOString());
    expect(s.cards.c1.lastReviewedAt).toBe(later.toISOString());
    expect(s.cards.c1.reviews).toBe(2);
  });

  it("a prévia não altera o estado", () => {
    const preview = previewSchedule(undefined, "facil", NOW);
    expect(preview.box).toBe(2);
    expect(EMPTY_PROGRESS.cards).toEqual({});
  });
});

describe("fila de revisão", () => {
  const cards = [
    { id: "a1", topicId: "a" },
    { id: "a2", topicId: "a" },
    { id: "b1", topicId: "b" },
  ];

  it("só libera cartões novos de tópicos já abertos", () => {
    const s = markTopicVisited(EMPTY_PROGRESS, "a");
    expect(getReviewQueue(s, cards, NOW)).toEqual({ due: [], fresh: ["a1", "a2"] });
  });

  it("também libera cartões de tópicos já praticados", () => {
    const s = recordAttempt(EMPTY_PROGRESS, {
      questionId: "q",
      topicId: "b",
      chosenId: "A",
      correct: true,
      at: NOW.toISOString(),
      mode: "pratica",
    });
    expect(getReviewQueue(s, cards, NOW).fresh).toEqual(["b1"]);
  });

  it("inclui cartões vencidos e esconde os que ainda não venceram", () => {
    let s = markTopicVisited(EMPTY_PROGRESS, "a");
    s = reviewCard(s, "a1", "dificil", new Date(2026, 9, 15, 10)); // venceu em 16/10
    s = reviewCard(s, "a2", "facil", NOW); // vence em 20/10
    expect(getReviewQueue(s, cards, NOW)).toEqual({ due: ["a1"], fresh: [] });
  });

  it("respeita o limite diário de cartões novos", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ id: `x${i}`, topicId: "a" }));
    let s = markTopicVisited(EMPTY_PROGRESS, "a");
    expect(getReviewQueue(s, many, NOW).fresh).toHaveLength(NEW_CARDS_PER_DAY);
    s = reviewCard(s, "x0", "facil", NOW);
    s = reviewCard(s, "x1", "facil", NOW);
    expect(getReviewQueue(s, many, NOW).fresh).toHaveLength(NEW_CARDS_PER_DAY - 2);
  });

  it("permite liberar tópicos explicitamente (revisão de um tópico só)", () => {
    const q = getReviewQueue(EMPTY_PROGRESS, cards, NOW, { unlockedTopics: ["b"] });
    expect(q.fresh).toEqual(["b1"]);
  });

  it("sem limite diário, libera cartões mesmo depois de muitos novos no dia", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, topicId: "a" }));
    let s = markTopicVisited(EMPTY_PROGRESS, "a");
    for (const c of many) s = reviewCard(s, c.id, "facil", NOW);
    const q = getReviewQueue(s, cards, NOW, { unlockedTopics: ["b"], newLimit: Number.POSITIVE_INFINITY });
    expect(q.fresh).toEqual(["b1"]);
  });
});

describe("resumos", () => {
  it("descreve quando o cartão volta", () => {
    expect(describeInterval(new Date(NOW.getTime() + 600_000), NOW)).toBe("hoje");
    expect(describeInterval(day(1), NOW)).toBe("amanhã");
    expect(describeInterval(day(7), NOW)).toBe("em 7 dias");
  });

  it("conta como aprendidos os cartões a partir da caixa 3", () => {
    let s = reviewCard(EMPTY_PROGRESS, "c1", "facil", NOW);
    expect(countLearnedCards(s)).toBe(0);
    s = reviewCard(s, "c1", "facil", NOW);
    expect(countLearnedCards(s)).toBe(1);
  });

  it("dá XP por revisão de cartão", () => {
    let s = reviewCard(EMPTY_PROGRESS, "c1", "facil", NOW);
    s = reviewCard(s, "c2", "errei", NOW);
    expect(getXp(s).xp).toBe(4);
  });
});

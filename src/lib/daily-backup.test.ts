import { describe, expect, it } from "vitest";
import { getAllQuestions, getAvailableTopicRefs } from "@/content";
import { backupFileName, parseBackup, serializeBackup } from "./backup";
import { DAILY_SIZE, dayKey, pickDailyQuestions, recordDaily } from "./daily";
import { EMPTY_PROGRESS, recordAttempt } from "./learning";
import { reviewCard } from "./spaced-repetition";

const topics = getAvailableTopicRefs().map((t) => t.id);

describe("desafio do dia", () => {
  it("usa a data local no formato ano-mês-dia", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("escolhe as mesmas questões no mesmo dia, de tópicos diferentes", () => {
    const a = pickDailyQuestions(getAllQuestions(), topics, "2026-10-18");
    const b = pickDailyQuestions(getAllQuestions(), [...topics].reverse(), "2026-10-18");
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    expect(a).toHaveLength(DAILY_SIZE);
    expect(new Set(a.map((q) => q.topicId)).size).toBe(DAILY_SIZE);
  });

  it("muda de um dia para o outro", () => {
    const days = ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21"];
    const sets = days.map((d) => pickDailyQuestions(getAllQuestions(), topics, d).map((q) => q.id).join());
    expect(new Set(sets).size).toBeGreaterThan(1);
  });

  it("guarda só o primeiro resultado do dia", () => {
    let s = recordDaily(EMPTY_PROGRESS, "2026-10-18", { correct: 2, total: 3, at: "x" });
    s = recordDaily(s, "2026-10-18", { correct: 3, total: 3, at: "y" });
    expect(s.daily["2026-10-18"]).toEqual({ correct: 2, total: 3, at: "x" });
  });
});

describe("cópia de segurança", () => {
  const state = reviewCard(
    recordAttempt(EMPTY_PROGRESS, {
      questionId: "porc-001",
      topicId: "porcentagem",
      chosenId: "B",
      correct: true,
      at: "2026-10-18T10:00:00.000Z",
      mode: "pratica",
    }),
    "pc-01",
    "facil",
    new Date(2026, 9, 18),
  );

  it("ida e volta preserva o progresso", () => {
    const result = parseBackup(serializeBackup(state));
    expect(result).toEqual({ ok: true, state });
  });

  it("completa campos de cópias antigas", () => {
    const old = JSON.stringify({ app: "soma", kind: "progresso", data: { version: 1, attempts: [], visitedTopics: ["x"] } });
    const result = parseBackup(old);
    expect(result.ok && result.state.cards).toEqual({});
    expect(result.ok && result.state.daily).toEqual({});
    expect(result.ok && result.state.visitedTopics).toEqual(["x"]);
  });

  it.each([
    ["texto qualquer", "não foi possível ler"],
    [JSON.stringify({ app: "outro", kind: "progresso", data: {} }), "não é uma cópia"],
    [JSON.stringify({ app: "soma", kind: "progresso", data: { version: 2 } }), "incompleta"],
    [JSON.stringify({ app: "soma", kind: "progresso", data: { version: 1, attempts: [{}], visitedTopics: [] } }), "incompleta"],
  ])("recusa arquivos inválidos (%#)", (text, message) => {
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(message);
  });

  it("dá nome ao arquivo com a data", () => {
    expect(backupFileName(new Date("2026-10-18T12:00:00Z"))).toBe("soma-progresso-2026-10-18.json");
  });
});

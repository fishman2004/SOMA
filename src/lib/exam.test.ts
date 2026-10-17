import { describe, expect, it } from "vitest";
import { getAllQuestions, getQuestion, type Question } from "@/content";
import { buildExam, formatClock, formatDuration, recordExam, scoreExam, seededRandom } from "./exam";
import { EMPTY_PROGRESS, getErrorEntries } from "./learning";

const all = getAllQuestions();
const topics = [...new Set(all.map((q) => q.topicId))];

describe("montagem do simulado", () => {
  it("escolhe a quantidade pedida, sem repetir questões", () => {
    const exam = buildExam(all, { topicIds: topics, count: 10, random: seededRandom(1) });
    expect(exam).toHaveLength(10);
    expect(new Set(exam.map((q) => q.id)).size).toBe(10);
  });

  it("equilibra os tópicos", () => {
    const exam = buildExam(all, { topicIds: topics, count: 10, random: seededRandom(2) });
    const counts = topics.map((t) => exam.filter((q) => q.topicId === t).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("usa só os tópicos escolhidos", () => {
    const exam = buildExam(all, { topicIds: ["porcentagem"], count: 5, random: seededRandom(3) });
    expect(exam.every((q) => q.topicId === "porcentagem")).toBe(true);
  });

  it("não inventa questões quando faltam", () => {
    const exam = buildExam(all, { topicIds: ["porcentagem"], count: 50, random: seededRandom(4) });
    expect(exam.length).toBe(all.filter((q) => q.topicId === "porcentagem").length);
  });

  it("é reproduzível com a mesma semente", () => {
    const a = buildExam(all, { topicIds: topics, count: 5, random: seededRandom(9) }).map((q) => q.id);
    const b = buildExam(all, { topicIds: topics, count: 5, random: seededRandom(9) }).map((q) => q.id);
    expect(a).toEqual(b);
  });
});

describe("correção", () => {
  const qs = ["porc-001", "porc-005", "rp-001"].map((id) => getQuestion(id) as Question);

  it("conta acertos, respostas em branco e tópicos", () => {
    const score = scoreExam(qs, { "porc-001": "B", "porc-005": "180" });
    expect(score.correct).toBe(1);
    expect(score.answered).toBe(2);
    expect(score.byTopic).toEqual([
      { topicId: "porcentagem", total: 2, correct: 1 },
      { topicId: "razao-e-proporcao", total: 1, correct: 0 },
    ]);
  });

  it("registra as respondidas como tentativas e guarda o resumo", () => {
    const score = scoreExam(qs, { "porc-001": "B", "porc-005": "180" });
    const s = recordExam(EMPTY_PROGRESS, qs, score, {
      at: "2026-10-17T20:00:00.000Z",
      durationSeconds: 300,
      timed: false,
    });
    expect(s.attempts).toHaveLength(2);
    expect(s.attempts.every((a) => a.mode === "simulado")).toBe(true);
    expect(new Set(s.attempts.map((a) => a.at)).size).toBe(2);
    expect(getErrorEntries(s).map((e) => e.questionId)).toEqual(["porc-005"]);
    expect(s.exams).toEqual([
      { at: "2026-10-17T20:00:00.000Z", total: 3, correct: 1, durationSeconds: 300, timed: false },
    ]);
  });
});

describe("tempo", () => {
  it("formata duração e cronômetro", () => {
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(725)).toBe("12 min 05 s");
    expect(formatClock(125)).toBe("02:05");
    expect(formatClock(-3)).toBe("00:00");
  });
});

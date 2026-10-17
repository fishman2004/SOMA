import { describe, expect, it } from "vitest";
import { bestWeekStudyDays, getAchievements } from "./achievements";
import { EMPTY_PROGRESS, recordAttempt, setAttemptCause, type Attempt, type ProgressState } from "./learning";
import { reviewCard } from "./spaced-repetition";

const topics = [{ id: "t", questionIds: ["q1", "q2"] }];

function attempt(questionId: string, correct: boolean, at: Date): Attempt {
  return { questionId, topicId: "t", chosenId: "A", correct, at: at.toISOString(), mode: "pratica" };
}

function earned(state: ProgressState): string[] {
  return getAchievements(state, topics, 5)
    .filter((a) => a.earned)
    .map((a) => a.id);
}

describe("conquistas", () => {
  it("começa sem nenhuma", () => {
    expect(earned(EMPTY_PROGRESS)).toEqual([]);
  });

  it("premia refletir sobre o erro e corrigi-lo", () => {
    const at = new Date(2026, 9, 12, 10);
    let s = recordAttempt(EMPTY_PROGRESS, attempt("q1", false, at));
    s = setAttemptCause(s, at.toISOString(), "errei-conta");
    expect(earned(s)).toEqual(["primeiro-passo", "erro-que-ensina"]);
    s = recordAttempt(s, attempt("q1", true, new Date(2026, 9, 13, 10)));
    expect(earned(s)).toContain("erro-corrigido");
  });

  it("reconhece tópico consolidado, dominado e trilha percorrida", () => {
    let s = recordAttempt(EMPTY_PROGRESS, attempt("q1", true, new Date(2026, 9, 12, 10)));
    s = recordAttempt(s, attempt("q2", true, new Date(2026, 9, 12, 11)));
    expect(earned(s)).toEqual(expect.arrayContaining(["topico-consolidado", "trilha-percorrida"]));
    expect(earned(s)).not.toContain("topico-dominado");
    s = recordAttempt(s, attempt("q1", true, new Date(2026, 9, 14, 9)));
    expect(earned(s)).toContain("topico-dominado");
  });

  it("reconhece cartão aprendido", () => {
    let s = reviewCard(EMPTY_PROGRESS, "c", "facil");
    s = reviewCard(s, "c", "facil");
    expect(earned(s)).toContain("memoria-em-dia");
  });

  it("conta dias de estudo dentro da mesma semana", () => {
    let s: ProgressState = EMPTY_PROGRESS;
    // segunda (12/10) a sexta (16/10) de 2026, e o domingo seguinte (18/10)
    for (const day of [12, 13, 14, 15, 16, 18]) s = recordAttempt(s, attempt("q1", true, new Date(2026, 9, day, 10)));
    expect(bestWeekStudyDays(s)).toBe(6);
    expect(earned(s)).toContain("semana-completa");

    let split: ProgressState = EMPTY_PROGRESS;
    // quinta a terça: atravessa duas semanas, no máximo 4 dias em uma
    for (const day of [15, 16, 17, 18, 19, 20]) split = recordAttempt(split, attempt("q1", true, new Date(2026, 9, day, 10)));
    expect(bestWeekStudyDays(split)).toBe(4);
  });
});

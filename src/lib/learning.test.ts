import { describe, expect, it } from "vitest";
import {
  CAUSE_TIPS,
  causeLabel,
  ERROR_CAUSES,
  getCauseStats,
  EMPTY_PROGRESS,
  getContinueTopicId,
  getErrorEntries,
  getTopicMastery,
  getTopicSteps,
  getWeekSummary,
  getXp,
  markTopicVisited,
  pickPracticeQuestions,
  recordAttempt,
  recordDrill,
  setAttemptCause,
  type Attempt,
  type ProgressState,
} from "./learning";

const Q = ["q1", "q2", "q3", "q4"];

function attempt(questionId: string, correct: boolean, at: string, extra: Partial<Attempt> = {}): Attempt {
  return { questionId, topicId: "t", chosenId: correct ? "A" : "B", correct, at, mode: "pratica", ...extra };
}

function withAttempts(...attempts: Attempt[]): ProgressState {
  return attempts.reduce(recordAttempt, EMPTY_PROGRESS);
}

describe("caderno de erros", () => {
  it("guarda a questão errada como pendente", () => {
    const s = withAttempts(attempt("q1", false, "2026-10-12T10:00:00"));
    const [entry] = getErrorEntries(s);
    expect(entry.questionId).toBe("q1");
    expect(entry.status).toBe("pendente");
  });

  it("marca como resolvido quando a tentativa mais recente acerta", () => {
    const s = withAttempts(
      attempt("q1", false, "2026-10-12T10:00:00"),
      attempt("q1", true, "2026-10-13T10:00:00", { mode: "revisao" }),
    );
    expect(getErrorEntries(s)[0].status).toBe("resolvido");
  });

  it("volta a ficar pendente se errar de novo", () => {
    const s = withAttempts(
      attempt("q1", false, "2026-10-12T10:00:00"),
      attempt("q1", true, "2026-10-13T10:00:00"),
      attempt("q1", false, "2026-10-14T10:00:00"),
    );
    expect(getErrorEntries(s)[0].status).toBe("pendente");
  });

  it("não lista questões que nunca foram erradas", () => {
    const s = withAttempts(attempt("q1", true, "2026-10-12T10:00:00"));
    expect(getErrorEntries(s)).toHaveLength(0);
  });

  it("registra a causa do erro na tentativa certa", () => {
    const at = "2026-10-12T10:00:00";
    const s = setAttemptCause(withAttempts(attempt("q1", false, at)), at, "errei-conta");
    expect(s.attempts[0].cause).toBe("errei-conta");
  });
});

describe("causas de erro", () => {
  it("mostra o nome das causas atuais e das antigas já salvas", () => {
    expect(causeLabel("errei-conta")).toBe("Errei o cálculo");
    expect(causeLabel("somei-percentuais")).toBe("Somei os percentuais");
    expect(causeLabel(undefined)).toBeUndefined();
  });
});

describe("domínio do tópico", () => {
  it("começa como não iniciado", () => {
    expect(getTopicMastery(EMPTY_PROGRESS, "t", Q).level).toBe("nao-iniciado");
  });

  it("fica em praticando enquanto faltam questões", () => {
    const s = withAttempts(attempt("q1", true, "2026-10-12T10:00:00"));
    expect(getTopicMastery(s, "t", Q).level).toBe("praticando");
  });

  it("consolida com todas respondidas e 75% de acerto de primeira", () => {
    const s = withAttempts(
      attempt("q1", true, "2026-10-12T10:00:00"),
      attempt("q2", true, "2026-10-12T10:01:00"),
      attempt("q3", true, "2026-10-12T10:02:00"),
      attempt("q4", false, "2026-10-12T10:03:00"),
    );
    const m = getTopicMastery(s, "t", Q);
    expect(m.firstTryCorrect).toBe(3);
    expect(m.level).toBe("consolidando");
  });

  it("não consolida com menos de 75% de acerto de primeira", () => {
    const s = withAttempts(
      attempt("q1", true, "2026-10-12T10:00:00"),
      attempt("q2", true, "2026-10-12T10:01:00"),
      attempt("q3", false, "2026-10-12T10:02:00"),
      attempt("q4", false, "2026-10-12T10:03:00"),
    );
    expect(getTopicMastery(s, "t", Q).level).toBe("praticando");
  });

  it("acertar depois de errar não muda o acerto de primeira", () => {
    const s = withAttempts(
      attempt("q1", false, "2026-10-12T10:00:00"),
      attempt("q1", true, "2026-10-12T10:05:00"),
    );
    expect(getTopicMastery(s, "t", Q).firstTryCorrect).toBe(0);
  });

  it("só domina com acertos em dois dias e sem erros pendentes", () => {
    const sameDay = withAttempts(
      attempt("q1", true, "2026-10-12T10:00:00"),
      attempt("q2", true, "2026-10-12T10:01:00"),
      attempt("q3", true, "2026-10-12T10:02:00"),
      attempt("q4", false, "2026-10-12T10:03:00"),
      attempt("q4", true, "2026-10-12T10:04:00"),
    );
    expect(getTopicMastery(sameDay, "t", Q).level).toBe("consolidando");

    const nextDay = recordAttempt(sameDay, attempt("q4", true, "2026-10-14T09:00:00", { mode: "revisao" }));
    expect(getTopicMastery(nextDay, "t", Q).level).toBe("dominado");
  });
});

describe("etapas do tópico", () => {
  it("segue estudar → praticar → revisar → concluído", () => {
    let s = EMPTY_PROGRESS;
    expect(getTopicSteps(s, "t", ["q1"]).current).toBe("estudar");
    s = markTopicVisited(s, "t");
    expect(getTopicSteps(s, "t", ["q1"]).current).toBe("praticar");
    s = recordAttempt(s, attempt("q1", false, "2026-10-12T10:00:00"));
    expect(getTopicSteps(s, "t", ["q1"]).current).toBe("revisar");
    s = recordAttempt(s, attempt("q1", true, "2026-10-12T11:00:00"));
    expect(getTopicSteps(s, "t", ["q1"]).current).toBe("concluido");
  });
});

describe("semana de estudo", () => {
  it("conta dias de segunda a domingo", () => {
    // 17/10/2026 é um sábado; a semana começa na segunda, 12/10.
    const now = new Date(2026, 9, 17, 15, 0);
    const s = withAttempts(
      attempt("q1", true, new Date(2026, 9, 11, 10).toISOString()), // domingo anterior: fora
      attempt("q1", true, new Date(2026, 9, 12, 10).toISOString()), // segunda
      attempt("q2", true, new Date(2026, 9, 12, 11).toISOString()), // segunda
      attempt("q3", true, new Date(2026, 9, 14, 10).toISOString()), // quarta
    );
    const week = getWeekSummary(s, now);
    expect(week.days.map((d) => d.count)).toEqual([2, 0, 1, 0, 0, 0, 0]);
    expect(week.studyDays).toBe(2);
    expect(week.days[5].isToday).toBe(true);
  });
});

describe("XP", () => {
  it("premia ações úteis, não só cliques", () => {
    const at = "2026-10-12T10:00:00";
    let s = withAttempts(attempt("q1", true, "2026-10-12T09:00:00"), attempt("q2", false, at));
    s = setAttemptCause(s, at, "chutei");
    s = recordAttempt(s, attempt("q2", true, "2026-10-13T10:00:00"));
    // q1: 5 + 5 (de primeira) | q2: 5 + 5 (causa) | refazer certo: 5 + 10
    expect(getXp(s)).toEqual({ xp: 35, level: 1, intoLevel: 35 });
  });
});

describe("continuar de onde parou", () => {
  const topics = [
    { id: "a", questionIds: ["a1"] },
    { id: "b", questionIds: ["b1"] },
  ];

  it("sugere o primeiro tópico quando nada foi feito", () => {
    expect(getContinueTopicId(EMPTY_PROGRESS, topics)).toBe("a");
  });

  it("sugere o último tópico estudado que não foi dominado", () => {
    const s = withAttempts({ ...attempt("b1", false, "2026-10-12T10:00:00"), topicId: "b" });
    expect(getContinueTopicId(s, topics)).toBe("b");
  });
});

describe("treinos de técnicas", () => {
  it("guarda o melhor treino: mais acertos, depois menos tempo", () => {
    let s = recordDrill(EMPTY_PROGRESS, "vezes-11", { correct: 8, seconds: 40, at: "2026-10-18T10:00:00Z" });
    s = recordDrill(s, "vezes-11", { correct: 10, seconds: 60, at: "2026-10-18T10:05:00Z" });
    s = recordDrill(s, "vezes-11", { correct: 10, seconds: 50, at: "2026-10-18T10:10:00Z" });
    s = recordDrill(s, "vezes-11", { correct: 9, seconds: 20, at: "2026-10-18T10:15:00Z" });
    expect(s.drills["vezes-11"]).toEqual({
      sessions: 4,
      totalCorrect: 37,
      bestCorrect: 10,
      bestSeconds: 50,
      lastAt: "2026-10-18T10:15:00Z",
    });
    expect(getXp(s).xp).toBe(37);
  });
});

describe("escolha das questões da prática", () => {
  const qs = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"].map((id) => ({ id }));

  it("começa pelas questões nunca respondidas, na ordem do tópico", () => {
    expect(pickPracticeQuestions(EMPTY_PROGRESS, qs).map((q) => q.id)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
  });

  it("depois de uma rodada, traz as que faltam e completa com erros", () => {
    let s = EMPTY_PROGRESS;
    s = recordAttempt(s, attempt("q1", true, "2026-10-12T10:00:00"));
    s = recordAttempt(s, attempt("q2", false, "2026-10-12T10:01:00"));
    s = recordAttempt(s, attempt("q3", true, "2026-10-12T10:02:00"));
    s = recordAttempt(s, attempt("q4", false, "2026-10-12T10:03:00"));
    s = recordAttempt(s, attempt("q5", true, "2026-10-12T10:04:00"));
    // Faltam q6, q7, q8; depois, os erros q2 e q4.
    expect(pickPracticeQuestions(s, qs).map((q) => q.id)).toEqual(["q2", "q4", "q6", "q7", "q8"]);
  });

  it("com tudo respondido e certo, traz as mais antigas", () => {
    let s = EMPTY_PROGRESS;
    qs.forEach((q, i) => {
      s = recordAttempt(s, attempt(q.id, true, `2026-10-1${i}T10:00:00`));
    });
    expect(pickPracticeQuestions(s, qs, 3).map((q) => q.id)).toEqual(["q1", "q2", "q3"]);
  });
});

describe("causas de erro mais comuns", () => {
  it("conta e ordena as causas apontadas", () => {
    let s = EMPTY_PROGRESS;
    const add = (id: string, at: string, cause?: "li-rapido" | "errei-conta") => {
      s = recordAttempt(s, attempt(id, false, at, { cause }));
    };
    add("q1", "2026-10-12T10:00:00", "li-rapido");
    add("q2", "2026-10-12T10:01:00", "errei-conta");
    add("q3", "2026-10-12T10:02:00", "li-rapido");
    add("q4", "2026-10-12T10:03:00");
    expect(getCauseStats(s)).toEqual([
      { cause: "li-rapido", label: "Li rápido demais", count: 2 },
      { cause: "errei-conta", label: "Errei o cálculo", count: 1 },
    ]);
  });

  it("toda causa oferecida tem uma dica", () => {
    for (const c of ERROR_CAUSES) expect(CAUSE_TIPS[c.id], c.id).toBeTruthy();
  });
});

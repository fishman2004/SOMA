/**
 * Regras de aprendizagem do SOMA.
 *
 * Funções puras: recebem o estado do progresso e devolvem um novo
 * estado ou um cálculo. Não leem nem gravam nada por conta própria,
 * o que as torna fáceis de testar (veja `learning.test.ts`).
 */

export type ErrorCause =
  | "nao-lembrava"
  | "montei-errado"
  | "errei-conta"
  | "unidade-ou-base"
  | "li-rapido"
  | "chutei"
  /** Opção antiga, específica de Porcentagem. Mantida para progresso já salvo. */
  | "somei-percentuais";

/** Causas oferecidas ao estudante. Valem para qualquer tópico. */
export const ERROR_CAUSES: { id: ErrorCause; label: string }[] = [
  { id: "nao-lembrava", label: "Não lembrava a regra" },
  { id: "montei-errado", label: "Montei a conta errado" },
  { id: "errei-conta", label: "Errei o cálculo" },
  { id: "unidade-ou-base", label: "Confundi unidade ou base" },
  { id: "li-rapido", label: "Li rápido demais" },
  { id: "chutei", label: "Chutei" },
];

const LEGACY_CAUSE_LABELS: Partial<Record<ErrorCause, string>> = {
  "somei-percentuais": "Somei os percentuais",
};

export function causeLabel(cause: ErrorCause | undefined): string | undefined {
  if (!cause) return undefined;
  return ERROR_CAUSES.find((c) => c.id === cause)?.label ?? LEGACY_CAUSE_LABELS[cause];
}

export interface Attempt {
  questionId: string;
  topicId: string;
  chosenId: string;
  correct: boolean;
  /** Data e hora no formato ISO 8601. Também serve de identificador. */
  at: string;
  /** "pratica" = sessão do tópico; "revisao" = refazendo um erro; "simulado" = prova sem feedback imediato. */
  mode: "pratica" | "revisao" | "simulado";
  cause?: ErrorCause;
}

/** Situação de um cartão de memória para o estudante (veja `spaced-repetition.ts`). */
export interface CardState {
  /** Caixa de 1 a 5: quanto maior, mais espaçadas as revisões. */
  box: number;
  /** Quando o cartão volta a aparecer (ISO 8601). */
  dueAt: string;
  /** Primeira revisão (ISO 8601). */
  firstReviewedAt: string;
  lastReviewedAt: string;
  reviews: number;
  /** Quantas vezes o estudante marcou "Errei". */
  lapses: number;
}

export interface ProgressState {
  version: 1;
  attempts: Attempt[];
  visitedTopics: string[];
  /** Cartões já revisados, por id. Cartões nunca vistos não aparecem aqui. */
  cards: Record<string, CardState>;
  /** Histórico de simulados concluídos (veja `exam.ts`). */
  exams: ExamSummary[];
  /** Recordes dos treinos de técnicas de cálculo, por técnica. */
  drills: Record<string, DrillRecord>;
  /** Desafios do dia concluídos, pela data ("2026-10-18"). Veja `daily.ts`. */
  daily: Record<string, { correct: number; total: number; at: string }>;
}

/** Resultado acumulado dos treinos de uma técnica. */
export interface DrillRecord {
  sessions: number;
  /** Total de contas certas em todos os treinos. */
  totalCorrect: number;
  /** Melhor treino: mais acertos e, no empate, menos tempo. */
  bestCorrect: number;
  bestSeconds: number;
  lastAt: string;
}

/** Quantidade de contas em um treino de técnica. */
export const DRILL_SIZE = 10;

export function recordDrill(
  state: ProgressState,
  techniqueId: string,
  result: { correct: number; seconds: number; at: string },
): ProgressState {
  const prev = state.drills[techniqueId];
  const isBest =
    !prev ||
    result.correct > prev.bestCorrect ||
    (result.correct === prev.bestCorrect && result.seconds < prev.bestSeconds);
  const next: DrillRecord = {
    sessions: (prev?.sessions ?? 0) + 1,
    totalCorrect: (prev?.totalCorrect ?? 0) + result.correct,
    bestCorrect: isBest ? result.correct : prev.bestCorrect,
    bestSeconds: isBest ? result.seconds : prev.bestSeconds,
    lastAt: result.at,
  };
  return { ...state, drills: { ...state.drills, [techniqueId]: next } };
}

/** Resumo de um simulado concluído. */
export interface ExamSummary {
  at: string;
  total: number;
  correct: number;
  durationSeconds: number;
  timed: boolean;
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  attempts: [],
  visitedTopics: [],
  cards: {},
  exams: [],
  drills: {},
  daily: {},
};

/* ------------------------------------------------------------------ */
/* Mudanças de estado                                                  */
/* ------------------------------------------------------------------ */

export function recordAttempt(state: ProgressState, attempt: Attempt): ProgressState {
  return { ...state, attempts: [...state.attempts, attempt] };
}

export function setAttemptCause(
  state: ProgressState,
  attemptAt: string,
  cause: ErrorCause | undefined,
): ProgressState {
  return {
    ...state,
    attempts: state.attempts.map((a) => (a.at === attemptAt ? { ...a, cause } : a)),
  };
}

export function markTopicVisited(state: ProgressState, topicId: string): ProgressState {
  if (state.visitedTopics.includes(topicId)) return state;
  return { ...state, visitedTopics: [...state.visitedTopics, topicId] };
}

/* ------------------------------------------------------------------ */
/* Caderno de erros                                                    */
/* ------------------------------------------------------------------ */

export interface ErrorEntry {
  questionId: string;
  topicId: string;
  /** Tentativa errada mais recente. */
  lastWrong: Attempt;
  /** "pendente" enquanto a tentativa mais recente estiver errada. */
  status: "pendente" | "resolvido";
}

function attemptsByQuestion(state: ProgressState): Map<string, Attempt[]> {
  const map = new Map<string, Attempt[]>();
  for (const a of state.attempts) {
    const list = map.get(a.questionId) ?? [];
    list.push(a);
    map.set(a.questionId, list);
  }
  for (const list of map.values()) list.sort((x, y) => x.at.localeCompare(y.at));
  return map;
}

/** Uma entrada por questão que já foi errada, da mais recente para a mais antiga. */
export function getErrorEntries(state: ProgressState): ErrorEntry[] {
  const entries: ErrorEntry[] = [];
  for (const [questionId, list] of attemptsByQuestion(state)) {
    const wrongs = list.filter((a) => !a.correct);
    if (wrongs.length === 0) continue;
    const lastWrong = wrongs[wrongs.length - 1];
    const latest = list[list.length - 1];
    entries.push({
      questionId,
      topicId: lastWrong.topicId,
      lastWrong,
      status: latest.correct ? "resolvido" : "pendente",
    });
  }
  return entries.sort((x, y) => y.lastWrong.at.localeCompare(x.lastWrong.at));
}

export function countPendingErrors(state: ProgressState, topicId?: string): number {
  return getErrorEntries(state).filter(
    (e) => e.status === "pendente" && (topicId === undefined || e.topicId === topicId),
  ).length;
}

/** Quantas vezes cada causa foi apontada nos erros, da mais comum para a menos comum. */
export function getCauseStats(state: ProgressState): { cause: ErrorCause; label: string; count: number }[] {
  const counts = new Map<ErrorCause, number>();
  for (const a of state.attempts) {
    if (!a.correct && a.cause) counts.set(a.cause, (counts.get(a.cause) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([cause, count]) => ({ cause, label: causeLabel(cause) ?? cause, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Dica prática para cada causa de erro. */
export const CAUSE_TIPS: Partial<Record<ErrorCause, string>> = {
  "nao-lembrava": "Revise a ideia-chave do tópico e use os cartões de memória: eles voltam no dia certo.",
  "montei-errado": "Antes de calcular, escreva o que a questão dá e o que ela pede. Na regra de três, decida se é direta ou inversa.",
  "errei-conta": "Confira com uma estimativa ou com o noves fora. As técnicas de cálculo rápido ajudam a errar menos.",
  "unidade-ou-base": "Sublinhe as unidades e pergunte: a porcentagem é sobre qual valor? Converta tudo antes de calcular.",
  "li-rapido": "Leia a pergunta final duas vezes antes de responder. Muitas alternativas erradas respondem outra pergunta.",
  chutei: "Tudo bem chutar às vezes, mas registre o que faltou: depois, refaça a questão pelo caderno de erros.",
  "somei-percentuais": "Aumentos e descontos seguidos se multiplicam: use os fatores (1,25 × 0,80).",
};

/* ------------------------------------------------------------------ */
/* Domínio por tópico                                                  */
/* ------------------------------------------------------------------ */

export type MasteryLevel = "nao-iniciado" | "praticando" | "consolidando" | "dominado";

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  "nao-iniciado": "Não iniciado",
  praticando: "Praticando",
  consolidando: "Consolidando",
  dominado: "Dominado",
};

export interface TopicMastery {
  level: MasteryLevel;
  /** Questões diferentes respondidas pelo menos uma vez. */
  answered: number;
  total: number;
  /** Questões acertadas na primeira tentativa: o melhor sinal de aprendizagem. */
  firstTryCorrect: number;
}

/** Acerto mínimo na primeira tentativa para um tópico ser "consolidando". */
export const CONSOLIDATING_ACCURACY = 0.75;

function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Regras (simples de propósito, para o estudante entender):
 * - nao-iniciado: nenhuma questão respondida.
 * - praticando: começou, mas ainda não cumpre os critérios abaixo.
 * - consolidando: respondeu todas as questões e acertou pelo menos 75% de primeira.
 * - dominado: consolidando, sem erros pendentes e com acertos em dois dias diferentes
 *   (sinal de que lembrou depois de um intervalo, e não só na hora).
 */
export function getTopicMastery(
  state: ProgressState,
  topicId: string,
  questionIds: string[],
): TopicMastery {
  const total = questionIds.length;
  const byQuestion = attemptsByQuestion(state);
  let answered = 0;
  let firstTryCorrect = 0;
  for (const id of questionIds) {
    const list = byQuestion.get(id);
    if (!list || list.length === 0) continue;
    answered += 1;
    if (list[0].correct) firstTryCorrect += 1;
  }

  let level: MasteryLevel = "nao-iniciado";
  if (answered > 0) level = "praticando";

  const accuracy = total > 0 ? firstTryCorrect / total : 0;
  if (total > 0 && answered === total && accuracy >= CONSOLIDATING_ACCURACY) {
    level = "consolidando";
    const correctDays = new Set(
      state.attempts
        .filter((a) => a.topicId === topicId && a.correct)
        .map((a) => localDayKey(a.at)),
    );
    if (countPendingErrors(state, topicId) === 0 && correctDays.size >= 2) {
      level = "dominado";
    }
  }

  return { level, answered, total, firstTryCorrect };
}

/* ------------------------------------------------------------------ */
/* Escolha das questões de uma prática                                 */
/* ------------------------------------------------------------------ */

/** Quantidade de questões em uma sessão de prática de tópico. */
export const PRACTICE_SIZE = 5;

/**
 * Escolhe as questões de uma prática, na ordem do tópico:
 * 1. questões nunca respondidas;
 * 2. depois, as que estão erradas na tentativa mais recente;
 * 3. por fim, as respondidas há mais tempo (revisão espaçada simples).
 */
export function pickPracticeQuestions<T extends { id: string }>(
  state: ProgressState,
  questions: T[],
  size: number = PRACTICE_SIZE,
): T[] {
  const byQuestion = attemptsByQuestion(state);
  const position = new Map(questions.map((q, i) => [q.id, i]));
  const rank = (q: T): [number, string] => {
    const list = byQuestion.get(q.id);
    if (!list || list.length === 0) return [0, ""];
    const latest = list[list.length - 1];
    return [latest.correct ? 2 : 1, latest.at];
  };
  const chosen = [...questions]
    .sort((a, b) => {
      const [ga, ta] = rank(a);
      const [gb, tb] = rank(b);
      if (ga !== gb) return ga - gb;
      if (ta !== tb) return ta.localeCompare(tb);
      return position.get(a.id)! - position.get(b.id)!;
    })
    .slice(0, size);
  // Mantém a ordem original do tópico, que vai do mais simples ao mais difícil.
  return chosen.sort((a, b) => position.get(a.id)! - position.get(b.id)!);
}

/* ------------------------------------------------------------------ */
/* Etapas de um tópico                                                 */
/* ------------------------------------------------------------------ */

export interface TopicSteps {
  estudar: boolean;
  praticar: boolean;
  revisar: boolean;
  /** Etapa sugerida agora. */
  current: "estudar" | "praticar" | "revisar" | "concluido";
}

export function getTopicSteps(
  state: ProgressState,
  topicId: string,
  questionIds: string[],
): TopicSteps {
  const mastery = getTopicMastery(state, topicId, questionIds);
  const estudar = state.visitedTopics.includes(topicId) || mastery.answered > 0;
  const praticar = mastery.total > 0 && mastery.answered === mastery.total;
  const revisar = praticar && countPendingErrors(state, topicId) === 0;
  const current = !estudar ? "estudar" : !praticar ? "praticar" : !revisar ? "revisar" : "concluido";
  return { estudar, praticar, revisar, current };
}

/* ------------------------------------------------------------------ */
/* Semana de estudo                                                    */
/* ------------------------------------------------------------------ */

/** Meta semanal padrão: dias com pelo menos uma questão respondida. */
export const WEEKLY_GOAL_DAYS = 5;

export interface WeekDay {
  label: string;
  /** Questões respondidas no dia. */
  count: number;
  isToday: boolean;
}

export interface WeekSummary {
  days: WeekDay[];
  studyDays: number;
  goal: number;
}

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Semana de segunda a domingo, no fuso do aparelho. */
export function getWeekSummary(state: ProgressState, now: Date = new Date()): WeekSummary {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const offset = (start.getDay() + 6) % 7; // segunda = 0
  start.setDate(start.getDate() - offset);

  const days: WeekDay[] = WEEKDAY_LABELS.map((label, i) => ({
    label,
    count: 0,
    isToday: i === offset,
  }));

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  for (const a of state.attempts) {
    const d = new Date(a.at);
    if (d < start || d >= end) continue;
    const index = (d.getDay() + 6) % 7;
    days[index].count += 1;
  }

  return {
    days,
    studyDays: days.filter((d) => d.count > 0).length,
    goal: WEEKLY_GOAL_DAYS,
  };
}

/* ------------------------------------------------------------------ */
/* XP e nível (esforço, não domínio)                                   */
/* ------------------------------------------------------------------ */

export const XP_RULES = {
  answer: 5, // responder uma questão
  firstTryCorrect: 5, // bônus por acertar de primeira
  causeRegistered: 5, // refletir sobre a causa de um erro
  errorFixed: 10, // acertar uma questão que tinha errado
  cardReview: 2, // revisar um cartão de memória
  drillCorrect: 1, // acertar uma conta no treino de técnicas
} as const;

export const XP_PER_LEVEL = 100;

export interface XpSummary {
  xp: number;
  level: number;
  /** XP acumulado dentro do nível atual. */
  intoLevel: number;
}

export function getXp(state: ProgressState): XpSummary {
  let xp = 0;
  for (const [, list] of attemptsByQuestion(state)) {
    list.forEach((a, i) => {
      xp += XP_RULES.answer;
      if (i === 0 && a.correct) xp += XP_RULES.firstTryCorrect;
      if (a.cause) xp += XP_RULES.causeRegistered;
      if (i > 0 && a.correct && !list[i - 1].correct) xp += XP_RULES.errorFixed;
    });
  }
  for (const card of Object.values(state.cards)) {
    xp += card.reviews * XP_RULES.cardReview;
  }
  for (const drill of Object.values(state.drills)) {
    xp += drill.totalCorrect * XP_RULES.drillCorrect;
  }
  return { xp, level: Math.floor(xp / XP_PER_LEVEL) + 1, intoLevel: xp % XP_PER_LEVEL };
}

/* ------------------------------------------------------------------ */
/* Próximo passo                                                       */
/* ------------------------------------------------------------------ */

export interface TopicRef {
  id: string;
  questionIds: string[];
}

/**
 * Sugere o tópico para "continuar de onde parou":
 * o último tópico estudado que ainda não foi dominado; se não houver,
 * o primeiro tópico disponível da trilha que ainda não foi dominado.
 */
export function getContinueTopicId(state: ProgressState, topics: TopicRef[]): string | undefined {
  const notDone = (t: TopicRef) => getTopicMastery(state, t.id, t.questionIds).level !== "dominado";
  const lastTopicId = [...state.attempts].sort((a, b) => b.at.localeCompare(a.at))[0]?.topicId;
  const last = topics.find((t) => t.id === lastTopicId);
  if (last && notDone(last)) return last.id;
  return topics.find(notDone)?.id;
}

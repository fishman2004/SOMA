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
  /** "pratica" = primeira passagem pelo tópico; "revisao" = refazendo um erro. */
  mode: "pratica" | "revisao";
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
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  attempts: [],
  visitedTopics: [],
  cards: {},
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

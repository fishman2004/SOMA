/**
 * Simulado: questões misturadas, sem gabarito até o fim.
 * Funções puras para montar, corrigir e registrar um simulado.
 */
import type { Question } from "@/content";
import { isAnswerCorrect } from "./answers";
import { recordAttempt, type ExamSummary, type ProgressState } from "./learning";

/** Tempo sugerido por questão no modo cronometrado (o ENEM dá cerca de 3 minutos). */
export const SECONDS_PER_QUESTION = 180;

export const EXAM_SIZES = [5, 10, 15] as const;

/** Gerador de números pseudoaleatórios com semente (mulberry32), para testes reproduzíveis. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Escolhe as questões do simulado, equilibrando os tópicos: pega uma de
 * cada tópico por rodada, até completar a quantidade pedida.
 */
export function buildExam(
  questions: Question[],
  options: { topicIds: string[]; count: number; random?: () => number },
): Question[] {
  const random = options.random ?? Math.random;
  const pools = shuffle(options.topicIds, random)
    .map((topicId) => shuffle(questions.filter((q) => q.topicId === topicId), random))
    .filter((pool) => pool.length > 0);

  const picked: Question[] = [];
  while (picked.length < options.count && pools.some((pool) => pool.length > 0)) {
    for (const pool of pools) {
      const next = pool.shift();
      if (next) picked.push(next);
      if (picked.length === options.count) break;
    }
  }
  // Mistura a ordem final, para os tópicos não aparecerem sempre em sequência.
  return shuffle(picked, random);
}

export interface ExamScore {
  total: number;
  answered: number;
  correct: number;
  byTopic: { topicId: string; total: number; correct: number }[];
  /** Por questão, na ordem do simulado. */
  results: { questionId: string; given: string; correct: boolean }[];
}

/** Corrige o simulado. `answers` guarda a resposta já normalizada de cada questão ("" = em branco). */
export function scoreExam(questions: Question[], answers: Record<string, string>): ExamScore {
  const results = questions.map((q) => {
    const given = answers[q.id] ?? "";
    return { questionId: q.id, given, correct: given !== "" && isAnswerCorrect(q, given) };
  });

  const topicOrder: string[] = [];
  const byTopicMap = new Map<string, { total: number; correct: number }>();
  questions.forEach((q, i) => {
    if (!byTopicMap.has(q.topicId)) {
      topicOrder.push(q.topicId);
      byTopicMap.set(q.topicId, { total: 0, correct: 0 });
    }
    const t = byTopicMap.get(q.topicId)!;
    t.total += 1;
    if (results[i].correct) t.correct += 1;
  });

  return {
    total: questions.length,
    answered: results.filter((r) => r.given !== "").length,
    correct: results.filter((r) => r.correct).length,
    byTopic: topicOrder.map((topicId) => ({ topicId, ...byTopicMap.get(topicId)! })),
    results,
  };
}

/**
 * Registra o simulado no progresso: cada questão respondida vira uma
 * tentativa (as erradas vão para o caderno de erros) e o resumo entra no
 * histórico. Questões em branco não viram tentativa.
 */
export function recordExam(
  state: ProgressState,
  questions: Question[],
  score: ExamScore,
  meta: { at: string; durationSeconds: number; timed: boolean },
): ProgressState {
  let next = state;
  score.results.forEach((r, i) => {
    if (r.given === "") return;
    next = recordAttempt(next, {
      questionId: r.questionId,
      topicId: questions[i].topicId,
      chosenId: r.given,
      correct: r.correct,
      // Um milissegundo de diferença entre as tentativas mantém a ordem e os ids únicos.
      at: new Date(new Date(meta.at).getTime() + i).toISOString(),
      mode: "simulado",
    });
  });
  const record: ExamSummary = {
    at: meta.at,
    total: score.total,
    correct: score.correct,
    durationSeconds: meta.durationSeconds,
    timed: meta.timed,
  };
  return { ...next, exams: [...next.exams, record] };
}

/** "12 min 05 s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}

/** "02:05", para o cronômetro. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

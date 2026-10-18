/**
 * Desafio do dia: 3 questões escolhidas pela data, iguais para todo mundo
 * no mesmo dia, de tópicos diferentes. Sem sequência obrigatória: perder um
 * dia não zera nada.
 */
import type { Question } from "@/content";
import { buildExam, seededRandom } from "./exam";
import type { ProgressState } from "./learning";

export const DAILY_SIZE = 3;

/** "2026-10-18", no fuso do aparelho. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Número estável a partir do texto da data (hash FNV-1a). */
function seedFromKey(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

export function pickDailyQuestions(questions: Question[], topicIds: string[], key: string): Question[] {
  return buildExam(questions, {
    topicIds: [...topicIds].sort(),
    count: DAILY_SIZE,
    random: seededRandom(seedFromKey(key)),
  });
}

export function recordDaily(
  state: ProgressState,
  key: string,
  result: { correct: number; total: number; at: string },
): ProgressState {
  // Vale o primeiro resultado do dia: refazer não muda o registro.
  if (state.daily[key]) return state;
  return { ...state, daily: { ...state.daily, [key]: result } };
}

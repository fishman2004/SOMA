/**
 * Revisão espaçada dos cartões de memória (sistema de caixas de Leitner).
 *
 * Cada cartão fica em uma caixa de 1 a 5. Acertar com facilidade sobe o
 * cartão de caixa e espaça a próxima revisão; errar volta o cartão para a
 * caixa 1. Assim, o estudante revisa mais o que esquece e menos o que já sabe.
 *
 * Funções puras: recebem o estado e o "agora" e devolvem um novo estado.
 */
import type { CardState, ProgressState } from "./learning";

export type CardRating = "errei" | "dificil" | "facil";

export const MAX_BOX = 5;

/** Dias até a próxima revisão para cada caixa (índice 1 a 5). */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35] as const;

/** Depois de "Errei", o cartão volta ainda na mesma sessão. */
export const RELEARN_MINUTES = 10;

/** Cartões novos apresentados por dia, para a revisão não virar uma avalanche. */
export const NEW_CARDS_PER_DAY = 10;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Caixa e data da próxima revisão para uma resposta, sem alterar nada. */
export function previewSchedule(
  current: CardState | undefined,
  rating: CardRating,
  now: Date,
): { box: number; dueAt: Date } {
  const box = current?.box ?? 1;
  if (rating === "errei") {
    return { box: 1, dueAt: new Date(now.getTime() + RELEARN_MINUTES * 60_000) };
  }
  const nextBox = rating === "facil" ? Math.min(MAX_BOX, current ? box + 1 : 2) : box;
  // As revisões vencem no início do dia, para o estudante revisar quando quiser naquele dia.
  return { box: nextBox, dueAt: addDays(startOfDay(now), BOX_INTERVAL_DAYS[nextBox]) };
}

export function reviewCard(
  state: ProgressState,
  cardId: string,
  rating: CardRating,
  now: Date = new Date(),
): ProgressState {
  const current = state.cards[cardId];
  const { box, dueAt } = previewSchedule(current, rating, now);
  const at = now.toISOString();
  const next: CardState = {
    box,
    dueAt: dueAt.toISOString(),
    firstReviewedAt: current?.firstReviewedAt ?? at,
    lastReviewedAt: at,
    reviews: (current?.reviews ?? 0) + 1,
    lapses: (current?.lapses ?? 0) + (rating === "errei" ? 1 : 0),
  };
  return { ...state, cards: { ...state.cards, [cardId]: next } };
}

/** Texto curto para mostrar quando o cartão volta, ex.: "agora", "amanhã", "em 3 dias". */
export function describeInterval(dueAt: Date, now: Date): string {
  const days = Math.round((startOfDay(dueAt).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

export interface CardRef {
  id: string;
  topicId: string;
}

export interface ReviewQueue {
  /** Cartões já vistos cuja revisão venceu, do mais atrasado para o mais recente. */
  due: string[];
  /** Cartões nunca vistos liberados agora. */
  fresh: string[];
}

/** Tópicos cujos cartões já podem aparecer: os que o estudante abriu ou praticou. */
export function getUnlockedTopics(state: ProgressState): string[] {
  return [...new Set([...state.visitedTopics, ...state.attempts.map((a) => a.topicId)])];
}

/**
 * Monta a fila de revisão.
 *
 * Cartões novos só entram de tópicos que o estudante já abriu (`unlockedTopics`),
 * para não cobrar o que ele ainda não estudou, e respeitando o limite diário.
 */
export function getReviewQueue(
  state: ProgressState,
  cards: CardRef[],
  now: Date = new Date(),
  options: { unlockedTopics?: string[]; newLimit?: number } = {},
): ReviewQueue {
  const unlocked = new Set(options.unlockedTopics ?? getUnlockedTopics(state));
  const limit = options.newLimit ?? NEW_CARDS_PER_DAY;

  const due = cards
    .filter((c) => {
      const s = state.cards[c.id];
      return s && new Date(s.dueAt) <= now;
    })
    .sort((a, b) => state.cards[a.id].dueAt.localeCompare(state.cards[b.id].dueAt))
    .map((c) => c.id);

  const today = startOfDay(now);
  const introducedToday = Object.values(state.cards).filter(
    (s) => new Date(s.firstReviewedAt) >= today,
  ).length;
  const room = Math.max(0, limit - introducedToday);

  const fresh = cards
    .filter((c) => !state.cards[c.id] && unlocked.has(c.topicId))
    .slice(0, room)
    .map((c) => c.id);

  return { due, fresh };
}

/** Cartões na caixa 3 ou acima: lembrados com folga por pelo menos uma semana. */
export function countLearnedCards(state: ProgressState): number {
  return Object.values(state.cards).filter((s) => s.box >= 3).length;
}

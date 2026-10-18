/**
 * Revisão de conteúdo: ajuda pessoas (professores, amigos, a equipe) a
 * conferir questões, cartões e explicações antes de virarem "revisado".
 *
 * A revisão fica no navegador de quem revisa e é exportada em um arquivo,
 * que é enviado para quem mantém o conteúdo. Ninguém marca nada como
 * revisado diretamente: a decisão final é humana, no arquivo JSON do conteúdo.
 */
import type { Flashcard, Question, TechniqueText, Topic } from "@/content";

export type ReviewVerdict = "ok" | "ajustar";

export interface ReviewEntry {
  verdict: ReviewVerdict;
  comment: string;
  at: string;
}

/** Chave do item ("questao:porc-001") → revisão. */
export type ReviewState = Record<string, ReviewEntry>;

export type ReviewKind = "topico" | "questao" | "cartao" | "tecnica";

export interface ReviewItem {
  key: string;
  kind: ReviewKind;
  id: string;
  /** Tópico do item; técnicas ficam no tópico de técnicas de cálculo. */
  topicId: string;
}

export const KIND_LABEL: Record<ReviewKind, string> = {
  topico: "Explicação do tópico",
  questao: "Questão",
  cartao: "Cartão",
  tecnica: "Técnica",
};

export function reviewKey(kind: ReviewKind, id: string): string {
  return `${kind}:${id}`;
}

export function buildReviewItems(
  topics: Topic[],
  questions: Question[],
  cards: Flashcard[],
  techniques: TechniqueText[],
  techniquesTopicId: string,
): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const topic of topics) {
    if (topic.content) items.push({ key: reviewKey("topico", topic.id), kind: "topico", id: topic.id, topicId: topic.id });
    for (const q of questions.filter((x) => x.topicId === topic.id)) {
      items.push({ key: reviewKey("questao", q.id), kind: "questao", id: q.id, topicId: topic.id });
    }
    for (const c of cards.filter((x) => x.topicId === topic.id)) {
      items.push({ key: reviewKey("cartao", c.id), kind: "cartao", id: c.id, topicId: topic.id });
    }
    if (topic.id === techniquesTopicId) {
      for (const t of techniques) {
        items.push({ key: reviewKey("tecnica", t.id), kind: "tecnica", id: t.id, topicId: topic.id });
      }
    }
  }
  return items;
}

export function setVerdict(
  state: ReviewState,
  key: string,
  verdict: ReviewVerdict | null,
  at: string,
): ReviewState {
  const next = { ...state };
  if (verdict === null) {
    delete next[key];
    return next;
  }
  next[key] = { verdict, comment: state[key]?.comment ?? "", at };
  return next;
}

export function setComment(state: ReviewState, key: string, comment: string, at: string): ReviewState {
  const current = state[key];
  // Comentar sem dar veredito marca o item como "ajustar": comentário é sinal de que algo precisa mudar.
  return { ...state, [key]: { verdict: current?.verdict ?? "ajustar", comment, at } };
}

export function summarize(state: ReviewState, items: ReviewItem[]) {
  let ok = 0;
  let adjust = 0;
  for (const item of items) {
    const entry = state[item.key];
    if (entry?.verdict === "ok") ok += 1;
    else if (entry?.verdict === "ajustar") adjust += 1;
  }
  return { total: items.length, ok, adjust, pending: items.length - ok - adjust };
}

/** Arquivo para enviar a quem mantém o conteúdo. Só itens revisados entram. */
export function exportReview(state: ReviewState, items: ReviewItem[], exportedAt: Date = new Date()): string {
  const reviewed = items
    .filter((item) => state[item.key])
    .map((item) => ({
      tipo: item.kind,
      id: item.id,
      topico: item.topicId,
      veredito: state[item.key].verdict,
      comentario: state[item.key].comment,
    }));
  return JSON.stringify(
    {
      app: "soma",
      kind: "revisao-de-conteudo",
      exportedAt: exportedAt.toISOString(),
      resumo: summarize(state, items),
      itens: reviewed,
    },
    null,
    2,
  );
}

export function parseReviewState(saved: unknown): ReviewState {
  if (typeof saved !== "object" || saved === null || Array.isArray(saved)) return {};
  const result: ReviewState = {};
  for (const [key, value] of Object.entries(saved as Record<string, unknown>)) {
    const v = value as Partial<ReviewEntry>;
    if ((v?.verdict === "ok" || v?.verdict === "ajustar") && typeof v.at === "string") {
      result[key] = { verdict: v.verdict, comment: typeof v.comment === "string" ? v.comment : "", at: v.at };
    }
  }
  return result;
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getAllFlashcards, getFlashcard, getFlashcardsForTopic, getTopic } from "@/content";
import { useProgress } from "@/lib/progress-store";
import {
  describeInterval,
  getReviewQueue,
  getUnlockedTopics,
  previewSchedule,
  reviewCard,
  type CardRating,
} from "@/lib/spaced-repetition";
import { ArrowRightIcon } from "../icons";
import { Chip, Skeleton, buttonPrimary, buttonSecondary } from "../ui";

const RATINGS: { id: CardRating; label: string; tone: string }[] = [
  { id: "errei", label: "Errei", tone: "border-error/50 bg-error-soft text-error-strong hover:border-error" },
  { id: "dificil", label: "Difícil", tone: "border-line-strong bg-surface text-ink hover:border-ink" },
  { id: "facil", label: "Fácil", tone: "border-success/50 bg-success-soft text-success-strong hover:border-success" },
];

/**
 * Sessão de revisão de cartões. A fila é recalculada a cada resposta a partir
 * do progresso salvo: o cartão respondido sai da fila e só volta na data marcada.
 * Cartões marcados como "Errei" voltam no fim desta mesma sessão.
 */
export function CardSession({ topicId }: { topicId?: string }) {
  const { state, ready, update } = useProgress();
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [relearn, setRelearn] = useState<string[]>([]);
  const answerRef = useRef<HTMLDivElement>(null);

  if (!ready) return <Skeleton className="h-80" />;

  const now = new Date();
  const cards = topicId ? getFlashcardsForTopic(topicId) : getAllFlashcards();
  const queue = getReviewQueue(
    state,
    cards,
    now,
    // Revisão de um tópico escolhido pelo estudante: sem limite diário de cartões novos.
    topicId ? { unlockedTopics: [topicId], newLimit: Number.POSITIVE_INFINITY } : {},
  );
  const live = [...queue.due, ...queue.fresh];
  const ordered = [...live, ...relearn.filter((id) => !live.includes(id))];
  const currentId = ordered[0];
  const card = currentId ? getFlashcard(currentId) : undefined;

  function rate(rating: CardRating) {
    if (!card) return;
    const id = card.id;
    update((s) => reviewCard(s, id, rating, new Date()));
    setRelearn((list) =>
      rating === "errei" ? [...list.filter((x) => x !== id), id] : list.filter((x) => x !== id),
    );
    setReviewed((n) => n + 1);
    setRevealed(false);
  }

  if (!card) {
    const upcoming = cards
      .map((c) => state.cards[c.id]?.dueAt)
      .filter((d): d is string => Boolean(d))
      .sort()[0];
    const lockedAll = !topicId && getUnlockedTopics(state).length === 0;
    return (
      <div className="flex flex-col gap-4 pt-2">
        <h2 className="font-display text-2xl font-bold">
          {reviewed > 0 ? "Revisão concluída!" : "Nenhum cartão para agora"}
        </h2>
        <p className="leading-relaxed text-muted">
          {reviewed > 0
            ? `Você revisou ${reviewed === 1 ? "1 cartão" : `${reviewed} cartões`}. Voltar no dia certo é o que faz a memória durar.`
            : lockedAll
              ? "Os cartões de um tópico são liberados quando você abre o tópico pela primeira vez."
              : "Você está em dia com a revisão."}
          {upcoming && !lockedAll ? ` Próxima revisão: ${describeInterval(new Date(upcoming), now)}.` : ""}
        </p>
        <Link href={lockedAll ? "/estudar" : "/"} className={buttonPrimary}>
          {lockedAll ? "Ir para a trilha" : "Voltar ao início"}
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    );
  }

  const topic = getTopic(card.topicId);
  const isNew = !state.cards[card.id];
  const remaining = ordered.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Chip tone="primary">{topic?.name ?? "Tópico"}</Chip>
        <span className="text-sm text-muted" aria-live="polite">
          {remaining === 1 ? "Último cartão" : `${remaining} cartões na fila`}
        </span>
      </div>

      <article
        aria-label="Cartão de memória"
        className="flex min-h-64 flex-col gap-4 rounded-[20px] border border-line bg-surface p-6"
      >
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">
            {isNew ? "Cartão novo" : "Pergunta"}
          </span>
          <p className="font-display text-[22px] font-bold leading-snug">{card.front}</p>
        </div>
        {revealed ? (
          <div ref={answerRef} tabIndex={-1} className="flex flex-col gap-2 border-t border-line pt-4">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">Resposta</span>
            <p className="text-lg leading-relaxed">{card.back}</p>
          </div>
        ) : null}
      </article>

      {revealed ? (
        <div className="flex flex-col gap-2.5">
          <p id="como-foi" className="text-[15px] font-bold">
            Como foi lembrar?
          </p>
          <div role="group" aria-labelledby="como-foi" className="grid grid-cols-3 gap-2">
            {RATINGS.map((r) => {
              const when = describeInterval(previewSchedule(state.cards[card.id], r.id, now).dueAt, now);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => rate(r.id)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-[14px] border-2 px-2 font-bold ${r.tone}`}
                >
                  <span className="text-base">{r.label}</span>
                  <span className="text-xs font-normal">volta {when}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-muted">Seja honesto: a agenda se ajusta ao que você realmente lembra.</p>
        </div>
      ) : (
        <button
          type="button"
          className={buttonSecondary}
          onClick={() => {
            setRevealed(true);
            requestAnimationFrame(() => answerRef.current?.focus());
          }}
        >
          Mostrar resposta
        </button>
      )}

      {reviewed > 0 ? (
        <p className="text-center text-sm text-muted">
          {reviewed === 1 ? "1 cartão revisado" : `${reviewed} cartões revisados`} nesta sessão
        </p>
      ) : null}
    </div>
  );
}

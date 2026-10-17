"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Question } from "@/content";
import {
  ERROR_CAUSES,
  recordAttempt,
  setAttemptCause,
  type Attempt,
  type ErrorCause,
} from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { BookmarkIcon } from "./icons";
import { SourceBadge, buttonPrimary } from "./ui";

const DIFFICULTY_LABEL: Record<Question["difficulty"], string> = {
  facil: "Fácil",
  media: "Dificuldade média",
  dificil: "Difícil",
};

export interface QuestionResult {
  correct: boolean;
}

/**
 * Uma questão de múltipla escolha com feedback.
 * Registra a tentativa no progresso assim que a resposta é confirmada.
 *
 * `renderNext` desenha a ação que aparece depois da resposta
 * (próxima questão, voltar ao caderno etc.), definida por quem usa o componente.
 */
export function QuestionPlayer({
  question,
  mode,
  renderNext,
}: {
  question: Question;
  mode: Attempt["mode"];
  renderNext: (result: QuestionResult) => ReactNode;
}) {
  const { update } = useProgress();
  const [picked, setPicked] = useState<string | null>(null);
  const [attemptAt, setAttemptAt] = useState<string | null>(null);
  const [cause, setCause] = useState<ErrorCause | undefined>(undefined);
  const feedbackRef = useRef<HTMLHeadingElement>(null);

  const confirmed = attemptAt !== null;
  const correct = confirmed && picked === question.correctId;
  const correctAlt = question.alternatives.find((a) => a.id === question.correctId)!;
  const pickedAlt = question.alternatives.find((a) => a.id === picked);

  // Leva o foco ao resultado para que leitores de tela anunciem o feedback.
  useEffect(() => {
    if (confirmed) feedbackRef.current?.focus();
  }, [confirmed]);

  function confirm() {
    if (!picked || confirmed) return;
    const at = new Date().toISOString();
    update((s) =>
      recordAttempt(s, {
        questionId: question.id,
        topicId: question.topicId,
        chosenId: picked,
        correct: picked === question.correctId,
        at,
        mode,
      }),
    );
    setAttemptAt(at);
  }

  function chooseCause(next: ErrorCause) {
    if (!attemptAt) return;
    const value = cause === next ? undefined : next;
    setCause(value);
    update((s) => setAttemptCause(s, attemptAt, value));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <SourceBadge source={question.source} />
        <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[13px] text-muted">
          {DIFFICULTY_LABEL[question.difficulty]}
        </span>
      </div>

      <fieldset className="flex flex-col gap-4" disabled={confirmed}>
        <legend className="mb-4 flex flex-col gap-3">
          <span className="text-lg leading-relaxed">{question.statement}</span>
          <span className="text-lg font-bold leading-relaxed">{question.prompt}</span>
        </legend>

        <div className="flex flex-col gap-2.5">
          {question.alternatives.map((alt) => {
            const isPicked = picked === alt.id;
            const isCorrect = alt.id === question.correctId;
            let box = "border-line bg-surface hover:border-primary-tint";
            let badge = "bg-ground text-ink";
            let status = "";
            if (!confirmed && isPicked) {
              box = "border-primary bg-primary-soft";
              badge = "bg-primary text-white";
            }
            if (confirmed) {
              if (isCorrect) {
                box = "border-success bg-success-soft";
                badge = "bg-success text-white";
                status = " (resposta correta)";
              } else if (isPicked) {
                box = "border-error bg-error-soft";
                badge = "bg-error text-white";
                status = " (sua resposta)";
              } else {
                box = "border-line bg-surface opacity-55";
              }
            }
            return (
              <label
                key={alt.id}
                className={`flex min-h-14 items-center gap-3 rounded-[14px] border-2 px-3.5 py-2.5 text-[17px] has-[:focus-visible]:[outline:3px_solid_var(--color-primary)] has-[:focus-visible]:[outline-offset:2px] ${box} ${
                  confirmed ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name={`questao-${question.id}`}
                  value={alt.id}
                  checked={isPicked}
                  onChange={() => setPicked(alt.id)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-bold ${badge}`}
                >
                  {alt.id}
                </span>
                <span>
                  <span className="sr-only">Alternativa {alt.id}: </span>
                  {alt.text}
                  <span className="sr-only">{status}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {confirmed ? (
        <section
          aria-labelledby={`feedback-${question.id}`}
          className={`flex flex-col gap-3.5 rounded-2xl border p-[18px] ${
            correct ? "border-success/40 bg-success-soft" : "border-error/40 bg-error-soft"
          }`}
        >
          <div className="flex flex-col gap-1">
            <h2
              id={`feedback-${question.id}`}
              ref={feedbackRef}
              tabIndex={-1}
              className={`font-display text-xl font-bold ${correct ? "text-success-strong" : "text-error-strong"}`}
            >
              {correct
                ? "Isso! Resposta correta."
                : `Ainda não. A certa é ${correctAlt.id}) ${correctAlt.text}.`}
            </h2>
            {!correct && pickedAlt ? (
              <p className="text-[15px] text-muted">
                Você marcou {pickedAlt.id}) {pickedAlt.text}.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">Raciocínio</span>
            <p className="font-display text-base leading-relaxed">
              {question.reasoning.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="text-[15px] leading-normal">{question.explanation}</p>
          </div>

          {question.trap ? (
            <div className="flex flex-col gap-1 rounded-xl bg-surface px-3.5 py-3">
              <span className="text-sm font-bold">
                Armadilha comum: {question.alternatives.find((a) => a.id === question.trap!.alternativeId)?.text}
              </span>
              <span className="text-sm leading-normal text-muted">{question.trap.explanation}</span>
            </div>
          ) : null}

          {!correct ? (
            <div className="flex flex-col gap-2">
              <span id={`causa-${question.id}`} className="text-[15px] font-bold">
                O que aconteceu? <span className="font-normal text-muted">(opcional)</span>
              </span>
              <div role="group" aria-labelledby={`causa-${question.id}`} className="flex flex-wrap gap-2">
                {ERROR_CAUSES.map((c) => {
                  const on = cause === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => chooseCause(c.id)}
                      className={`min-h-11 rounded-full border-2 px-3.5 text-sm ${
                        on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-line-strong"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-success-strong">
                <BookmarkIcon size={16} strokeWidth={2.4} />
                Salva no seu caderno de erros
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-col gap-2.5 pt-1">
        {confirmed ? (
          renderNext({ correct })
        ) : (
          <button type="button" onClick={confirm} disabled={!picked} className={buttonPrimary}>
            Confirmar resposta
          </button>
        )}
      </div>
    </div>
  );
}

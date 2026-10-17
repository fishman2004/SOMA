"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { MultipleChoiceQuestion, NumericQuestion, Question } from "@/content";
import { correctAnswerText, givenAnswerText, isAnswerCorrect, mistakeExplanation } from "@/lib/answers";
import {
  ERROR_CAUSES,
  recordAttempt,
  setAttemptCause,
  type Attempt,
  type ErrorCause,
} from "@/lib/learning";
import { formatWithUnit, parseNumber } from "@/lib/numeric-answer";
import { useProgress } from "@/lib/progress-store";
import { DataTableView } from "./DataTableView";
import { BookmarkIcon } from "./icons";
import { SourceBadge, buttonPrimary } from "./ui";

export const DIFFICULTY_LABEL: Record<Question["difficulty"], string> = {
  facil: "Fácil",
  media: "Dificuldade média",
  dificil: "Difícil",
};

export interface QuestionResult {
  correct: boolean;
}

/** Enunciado completo: texto, tabela (se houver). A pergunta fica no campo de resposta. */
export function QuestionStatement({ question }: { question: Question }) {
  return (
    <>
      <p className="text-lg leading-relaxed">{question.statement}</p>
      {question.table ? <DataTableView table={question.table} /> : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Campos de resposta                                                  */
/* ------------------------------------------------------------------ */

export function MultipleChoiceField({
  question,
  value,
  onChange,
  revealed,
  name,
}: {
  question: MultipleChoiceQuestion;
  value: string;
  onChange: (value: string) => void;
  /** Mostra certo e errado nas alternativas. */
  revealed: boolean;
  name: string;
}) {
  return (
    <fieldset className="flex flex-col gap-4" disabled={revealed}>
      <legend className="mb-4 text-lg font-bold leading-relaxed">{question.prompt}</legend>
      <div className="flex flex-col gap-2.5">
        {question.alternatives.map((alt) => {
          const isPicked = value === alt.id;
          const isCorrect = alt.id === question.correctId;
          let box = "border-line bg-surface hover:border-primary-tint";
          let badge = "bg-ground text-ink";
          let status = "";
          if (!revealed && isPicked) {
            box = "border-primary bg-primary-soft";
            badge = "bg-primary text-on-strong";
          }
          if (revealed) {
            if (isCorrect) {
              box = "border-success bg-success-soft";
              badge = "bg-success text-on-strong";
              status = " (resposta correta)";
            } else if (isPicked) {
              box = "border-error bg-error-soft";
              badge = "bg-error text-on-strong";
              status = " (sua resposta)";
            } else {
              box = "border-line bg-surface opacity-55";
            }
          }
          return (
            <label
              key={alt.id}
              className={`flex min-h-14 items-center gap-3 rounded-[14px] border-2 px-3.5 py-2.5 text-[17px] has-[:focus-visible]:[outline:3px_solid_var(--color-primary)] has-[:focus-visible]:[outline-offset:2px] ${box} ${
                revealed ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={alt.id}
                checked={isPicked}
                onChange={() => onChange(alt.id)}
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
  );
}

export function NumericField({
  question,
  value,
  onChange,
  onSubmit,
  revealed,
  correct,
}: {
  question: NumericQuestion;
  value: string;
  onChange: (value: string) => void;
  /** Enter no campo confirma a resposta. */
  onSubmit?: () => void;
  revealed: boolean;
  /** Só faz sentido com `revealed`: pinta o campo de certo ou errado. */
  correct?: boolean;
}) {
  const id = useId();
  const invalid = value.trim() !== "" && parseNumber(value) === null;
  const tone = revealed
    ? correct
      ? "border-success bg-success-soft"
      : "border-error bg-error-soft"
    : invalid
      ? "border-error bg-surface"
      : "border-line-strong bg-surface focus-within:border-primary";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="mb-2 text-lg font-bold leading-relaxed">
        {question.prompt}
      </label>
      <div
        className={`flex min-h-14 items-center gap-2 rounded-[14px] border-2 px-3.5 has-[:focus-visible]:[outline:3px_solid_var(--color-primary)] has-[:focus-visible]:[outline-offset:2px] ${tone}`}
      >
        {question.prefix ? <span className="text-lg font-bold text-muted">{question.prefix}</span> : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={revealed}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-dica`}
          placeholder="Digite sua resposta"
          className="min-w-0 flex-1 bg-transparent py-3 font-display text-xl outline-none placeholder:font-sans placeholder:text-base placeholder:text-muted"
        />
        {question.unit ? <span className="text-lg text-muted">{question.unit}</span> : null}
      </div>
      <p id={`${id}-dica`} className={`text-sm ${invalid ? "font-bold text-error-strong" : "text-muted"}`}>
        {invalid
          ? "Não entendi esse número. Use só algarismos, com vírgula para decimais. Ex.: 12,5"
          : "Resposta numérica: use vírgula para decimais, se precisar."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Questão com feedback imediato                                       */
/* ------------------------------------------------------------------ */

/**
 * Uma questão com feedback imediato, em qualquer formato.
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
  const [answer, setAnswer] = useState("");
  const [given, setGiven] = useState<string | null>(null);
  const [attemptAt, setAttemptAt] = useState<string | null>(null);
  const [cause, setCause] = useState<ErrorCause | undefined>(undefined);
  const feedbackRef = useRef<HTMLHeadingElement>(null);

  const confirmed = attemptAt !== null && given !== null;
  const correct = confirmed && isAnswerCorrect(question, given);
  const canConfirm =
    question.kind === "numerica" ? parseNumber(answer) !== null : answer !== "";

  // Leva o foco ao resultado para que leitores de tela anunciem o feedback.
  useEffect(() => {
    if (confirmed) feedbackRef.current?.focus();
  }, [confirmed]);

  function confirm() {
    if (!canConfirm || confirmed) return;
    // Na numérica, guarda o número normalizado (ex.: "1020"), não o texto digitado.
    const normalized = question.kind === "numerica" ? String(parseNumber(answer)) : answer;
    const at = new Date().toISOString();
    update((s) =>
      recordAttempt(s, {
        questionId: question.id,
        topicId: question.topicId,
        chosenId: normalized,
        correct: isAnswerCorrect(question, normalized),
        at,
        mode,
      }),
    );
    setGiven(normalized);
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

      <QuestionStatement question={question} />

      {question.kind === "numerica" ? (
        <NumericField
          question={question}
          value={answer}
          onChange={setAnswer}
          onSubmit={confirm}
          revealed={confirmed}
          correct={correct}
        />
      ) : (
        <MultipleChoiceField
          question={question}
          value={answer}
          onChange={setAnswer}
          revealed={confirmed}
          name={`questao-${question.id}`}
        />
      )}

      {confirmed && given !== null ? (
        <section
          aria-labelledby={`feedback-${question.id}`}
          className={`flex flex-col gap-3.5 rounded-2xl border p-[18px] ${
            correct ? "border-success/40 bg-success-soft" : "border-error/40 bg-error-soft"
          }`}
        >
          <FeedbackBody question={question} given={given} correct={correct} headingRef={feedbackRef} />

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
                        on ? "border-ink bg-ink text-on-strong" : "border-line bg-surface text-ink hover:border-line-strong"
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
          <button type="button" onClick={confirm} disabled={!canConfirm} className={buttonPrimary}>
            Confirmar resposta
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Resultado, raciocínio e erro comum. Reaproveitado no feedback imediato
 * e na correção do simulado.
 */
export function FeedbackBody({
  question,
  given,
  correct,
  headingRef,
  headingLevel = "h2",
}: {
  question: Question;
  given: string;
  correct: boolean;
  headingRef?: React.Ref<HTMLHeadingElement>;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const matched = mistakeExplanation(question, given);
  const answered = given !== "";

  let pitfall: { title: string; text: string } | undefined;
  if (question.kind === "numerica") {
    const first = question.commonMistakes?.[0];
    if (!correct && matched) pitfall = { title: "Você caiu num erro comum", text: matched };
    else if (first)
      pitfall = {
        title: `Erro comum: ${formatWithUnit(first.value, question.prefix, question.unit)}`,
        text: first.explanation,
      };
  } else if (question.trap) {
    const trapAlt = question.alternatives.find((a) => a.id === question.trap!.alternativeId);
    pitfall = { title: `Armadilha comum: ${trapAlt?.text ?? ""}`, text: question.trap.explanation };
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <Heading
          id={`feedback-${question.id}`}
          ref={headingRef}
          tabIndex={-1}
          className={`font-display text-xl font-bold ${correct ? "text-success-strong" : "text-error-strong"}`}
        >
          {correct
            ? "Isso! Resposta correta."
            : answered
              ? `Ainda não. A certa é ${correctAnswerText(question)}.`
              : `Sem resposta. A certa é ${correctAnswerText(question)}.`}
        </Heading>
        {!correct && answered ? (
          <p className="text-[15px] text-muted">
            {question.kind === "numerica" ? "Você respondeu" : "Você marcou"} {givenAnswerText(question, given)}.
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

      {pitfall ? (
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface px-3.5 py-3">
          <span className="text-sm font-bold">{pitfall.title}</span>
          <span className="text-sm leading-normal text-muted">{pitfall.text}</span>
        </div>
      ) : null}
    </>
  );
}

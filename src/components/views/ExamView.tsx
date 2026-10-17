"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAllQuestions, getTopic, getTopics, isTopicAvailable, type Question } from "@/content";
import {
  buildExam,
  EXAM_SIZES,
  formatClock,
  formatDuration,
  recordExam,
  scoreExam,
  SECONDS_PER_QUESTION,
  type ExamScore,
} from "@/lib/exam";
import { parseNumber } from "@/lib/numeric-answer";
import { useProgress } from "@/lib/progress-store";
import { FeedbackBody, MultipleChoiceField, NumericField, QuestionStatement } from "../QuestionPlayer";
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon } from "../icons";
import { BackLink, Card, PageTitle, SectionTitle, buttonPrimary, buttonSecondary } from "../ui";

type Phase =
  | { kind: "setup" }
  | {
      kind: "running";
      questions: Question[];
      startedAt: number;
      /** Em milissegundos desde 1970; ausente sem cronômetro. */
      deadline?: number;
    }
  | { kind: "done"; questions: Question[]; score: ExamScore; durationSeconds: number; timed: boolean };

const AVAILABLE_TOPICS = getTopics().filter(isTopicAvailable);

/* ------------------------------------------------------------------ */
/* Configuração                                                        */
/* ------------------------------------------------------------------ */

function Setup({ onStart }: { onStart: (topicIds: string[], size: number, timed: boolean) => void }) {
  const { state, ready } = useProgress();
  const [topicIds, setTopicIds] = useState<string[]>(AVAILABLE_TOPICS.map((t) => t.id));
  const [size, setSize] = useState<number>(10);
  const [timed, setTimed] = useState(false);
  const last = ready ? state.exams[state.exams.length - 1] : undefined;
  const available = getAllQuestions().filter((q) => topicIds.includes(q.topicId)).length;

  function toggleTopic(id: string) {
    setTopicIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  return (
    <>
      <BackLink href="/">Início</BackLink>
      <PageTitle
        title="Simulado"
        intro="Questões misturadas, sem ver a resposta na hora, como na prova. A correção completa vem no final."
      />

      {last ? (
        <p className="rounded-xl bg-primary-soft px-4 py-3 text-[15px] text-primary-strong">
          Seu último simulado: <strong>{last.correct} de {last.total}</strong> em {formatDuration(last.durationSeconds)}.
        </p>
      ) : null}

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (topicIds.length > 0) onStart(topicIds, size, timed);
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-lg font-bold">Tópicos</legend>
          {AVAILABLE_TOPICS.map((t) => (
            <label
              key={t.id}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-3.5 has-[:checked]:border-primary"
            >
              <input
                type="checkbox"
                checked={topicIds.includes(t.id)}
                onChange={() => toggleTopic(t.id)}
                className="size-5 accent-[var(--color-primary)]"
              />
              <span className="text-base">{t.name}</span>
            </label>
          ))}
          {topicIds.length === 0 ? (
            <p className="text-sm font-bold text-error-strong">Escolha pelo menos um tópico.</p>
          ) : null}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-display text-lg font-bold">Quantidade de questões</legend>
          <div className="grid grid-cols-3 gap-2">
            {EXAM_SIZES.map((n) => (
              <label
                key={n}
                className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-line bg-surface text-base font-bold has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-strong has-[:focus-visible]:[outline:3px_solid_var(--color-primary)]"
              >
                <input
                  type="radio"
                  name="quantidade"
                  value={n}
                  checked={size === n}
                  onChange={() => setSize(n)}
                  className="sr-only"
                />
                {n}
              </label>
            ))}
          </div>
          {available < size ? (
            <p className="text-sm text-muted">
              Os tópicos escolhidos têm {available} questões: o simulado terá {available}.
            </p>
          ) : null}
        </fieldset>

        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
            className="mt-0.5 size-5 accent-[var(--color-primary)]"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-base font-bold">Com cronômetro</span>
            <span className="text-sm text-muted">
              {SECONDS_PER_QUESTION / 60} minutos por questão, perto do ritmo do ENEM. Quando o tempo acaba, o simulado é
              entregue.
            </span>
          </span>
        </label>

        <button type="submit" className={buttonPrimary} disabled={topicIds.length === 0}>
          Começar simulado
          <ArrowRightIcon size={18} />
        </button>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Prova                                                               */
/* ------------------------------------------------------------------ */

function normalize(question: Question, raw: string | undefined): string {
  if (!raw) return "";
  if (question.kind === "numerica") {
    const value = parseNumber(raw);
    return value === null ? "" : String(value);
  }
  return raw;
}

function Running({
  questions,
  deadline,
  onFinish,
}: {
  questions: Question[];
  deadline?: number;
  onFinish: (answers: Record<string, string>) => void;
}) {
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const question = questions[index];
  const remaining = deadline ? Math.max(0, (deadline - now) / 1000) : undefined;
  const answeredCount = questions.filter((q) => normalize(q, drafts[q.id]) !== "").length;

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const answers: Record<string, string> = {};
    for (const q of questions) answers[q.id] = normalize(q, drafts[q.id]);
    onFinish(answers);
  }

  // Referência sempre atual para o intervalo chamar a versão mais nova de `finish`.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  // Cronômetro: atualiza a cada segundo e entrega quando o tempo acaba.
  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline) finishRef.current();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  function goTo(i: number) {
    setIndex(i);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  function submit() {
    const blank = questions.length - answeredCount;
    const message =
      blank > 0
        ? `Você deixou ${blank === 1 ? "1 questão" : `${blank} questões`} em branco. Entregar mesmo assim?`
        : "Entregar o simulado e ver a correção?";
    if (window.confirm(message)) finish();
  }

  const setDraft = (value: string) => setDrafts((d) => ({ ...d, [question.id]: value }));
  const isFlagged = flagged.includes(question.id);
  const lowTime = remaining !== undefined && remaining <= 60;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-center justify-between gap-2 border-b border-line bg-ground px-5 py-3">
        <span className="text-sm font-bold text-muted">
          {answeredCount} de {questions.length} respondidas
        </span>
        {remaining !== undefined ? (
          <span
            role="timer"
            aria-label={`Tempo restante: ${formatClock(remaining)}`}
            className={`rounded-full px-3 py-1 font-display text-base font-bold tabular-nums ${
              lowTime ? "bg-error-soft text-error-strong" : "bg-surface text-ink"
            }`}
          >
            {formatClock(remaining)}
          </span>
        ) : null}
        <button type="button" onClick={submit} className="min-h-11 rounded-xl px-3 text-[15px] font-bold text-primary">
          Entregar
        </button>
      </div>

      <h1 ref={titleRef} tabIndex={-1} className="font-display text-2xl font-bold">
        Questão {index + 1} <span className="font-medium text-muted">de {questions.length}</span>
      </h1>

      <span className="self-start rounded-full bg-primary-soft px-2.5 py-1 text-[13px] font-bold text-primary-strong">
        {getTopic(question.topicId)?.name}
      </span>

      <QuestionStatement question={question} />

      {question.kind === "numerica" ? (
        <NumericField
          key={question.id}
          question={question}
          value={drafts[question.id] ?? ""}
          onChange={setDraft}
          revealed={false}
        />
      ) : (
        <MultipleChoiceField
          key={question.id}
          question={question}
          value={drafts[question.id] ?? ""}
          onChange={setDraft}
          revealed={false}
          name={`simulado-${question.id}`}
        />
      )}

      <button
        type="button"
        aria-pressed={isFlagged}
        onClick={() =>
          setFlagged((list) => (isFlagged ? list.filter((x) => x !== question.id) : [...list, question.id]))
        }
        className={`min-h-11 self-start rounded-full border-2 px-4 text-sm font-bold ${
          isFlagged ? "border-primary bg-primary-soft text-primary-strong" : "border-line bg-surface text-muted"
        }`}
      >
        {isFlagged ? "Marcada para revisar" : "Marcar para revisar"}
      </button>

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" className={buttonSecondary} disabled={index === 0} onClick={() => goTo(index - 1)}>
          <ChevronLeftIcon size={18} />
          Anterior
        </button>
        {index < questions.length - 1 ? (
          <button type="button" className={buttonPrimary} onClick={() => goTo(index + 1)}>
            Próxima
            <ArrowRightIcon size={18} />
          </button>
        ) : (
          <button type="button" className={buttonPrimary} onClick={submit}>
            Entregar
          </button>
        )}
      </div>

      <nav aria-label="Ir para a questão" className="flex flex-col gap-2 pt-2">
        <span className="text-sm font-bold text-muted">Ir para a questão</span>
        <ol className="grid grid-cols-5 gap-2">
          {questions.map((q, i) => {
            const answered = normalize(q, drafts[q.id]) !== "";
            const mark = flagged.includes(q.id);
            const current = i === index;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={current ? "step" : undefined}
                  aria-label={`Questão ${i + 1}${answered ? ", respondida" : ", em branco"}${mark ? ", marcada para revisar" : ""}`}
                  className={`relative flex min-h-11 w-full items-center justify-center rounded-xl border-2 font-display font-bold ${
                    current
                      ? "border-primary bg-primary text-on-strong"
                      : answered
                        ? "border-primary-tint bg-primary-soft text-primary-strong"
                        : "border-line bg-surface text-muted"
                  }`}
                >
                  {i + 1}
                  {mark ? (
                    <span aria-hidden="true" className="absolute right-1 top-1 size-2 rounded-full bg-error" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-muted">Azul claro: respondida · ponto laranja: marcada para revisar.</p>
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resultado                                                           */
/* ------------------------------------------------------------------ */

function Result({
  questions,
  score,
  durationSeconds,
  timed,
  onRestart,
}: {
  questions: Question[];
  score: ExamScore;
  durationSeconds: number;
  timed: boolean;
  onRestart: () => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  const wrong = score.answered - score.correct;
  const blank = score.total - score.answered;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">Resultado do simulado</span>
        <h1 ref={titleRef} tabIndex={-1} className="font-display text-[30px] font-bold leading-tight">
          {score.correct} de {score.total} acertos
        </h1>
        <p className="text-[15px] text-muted">
          {wrong} {wrong === 1 ? "erro" : "erros"} · {blank} em branco · {formatDuration(durationSeconds)}
          {timed ? " (com cronômetro)" : ""}
        </p>
      </div>

      <Card className="p-[18px]">
        <SectionTitle>Por tópico</SectionTitle>
        <ul className="flex flex-col gap-3">
          {score.byTopic.map((t) => (
            <li key={t.topicId} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-2 text-[15px]">
                <span className="font-bold">{getTopic(t.topicId)?.name}</span>
                <span className="text-muted">
                  {t.correct} de {t.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-track" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(t.correct / t.total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        {wrong > 0 ? (
          <p className="text-sm text-muted">As questões erradas foram para o caderno de erros.</p>
        ) : null}
      </Card>

      <section className="flex flex-col gap-2.5" aria-labelledby="correcao">
        <h2 id="correcao" className="font-display text-lg font-bold">
          Correção
        </h2>
        {questions.map((q, i) => {
          const r = score.results[i];
          return (
            <details key={q.id} className="group rounded-2xl border border-line bg-surface">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                    r.correct
                      ? "bg-success text-on-strong"
                      : r.given === ""
                        ? "bg-track text-muted"
                        : "bg-error text-on-strong"
                  }`}
                  aria-hidden="true"
                >
                  {r.correct ? <CheckIcon size={16} /> : i + 1}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-bold">
                    Questão {i + 1}: {r.correct ? "certa" : r.given === "" ? "em branco" : "errada"}
                  </span>
                  <span className="line-clamp-1 text-sm text-muted">{q.prompt}</span>
                </span>
                <span className="text-sm font-bold text-primary group-open:hidden">Ver</span>
                <span className="hidden text-sm font-bold text-primary group-open:inline">Fechar</span>
              </summary>
              <div className="flex flex-col gap-3.5 border-t border-line px-4 pb-4 pt-3">
                <QuestionStatement question={q} />
                <p className="text-base font-bold leading-relaxed">{q.prompt}</p>
                <FeedbackBody question={q} given={r.given} correct={r.correct} headingLevel="h3" />
              </div>
            </details>
          );
        })}
      </section>

      <div className="flex flex-col gap-2.5">
        {wrong > 0 ? (
          <Link href="/erros" className={buttonPrimary}>
            Ir para o caderno de erros
            <ArrowRightIcon size={18} />
          </Link>
        ) : null}
        <button type="button" onClick={onRestart} className={wrong > 0 ? buttonSecondary : buttonPrimary}>
          Fazer outro simulado
        </button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

export function ExamView() {
  const { update } = useProgress();
  const [phase, setPhase] = useState<Phase>({ kind: "setup" });

  if (phase.kind === "setup") {
    return (
      <Setup
        onStart={(topicIds, size, timed) => {
          const questions = buildExam(getAllQuestions(), { topicIds, count: size });
          const startedAt = Date.now();
          setPhase({
            kind: "running",
            questions,
            startedAt,
            deadline: timed ? startedAt + questions.length * SECONDS_PER_QUESTION * 1000 : undefined,
          });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (phase.kind === "running") {
    return (
      <Running
        questions={phase.questions}
        deadline={phase.deadline}
        onFinish={(answers) => {
          const end = Date.now();
          const durationSeconds = Math.round(
            (Math.min(end, phase.deadline ?? end) - phase.startedAt) / 1000,
          );
          const score = scoreExam(phase.questions, answers);
          const timed = phase.deadline !== undefined;
          update((s) =>
            recordExam(s, phase.questions, score, { at: new Date(end).toISOString(), durationSeconds, timed }),
          );
          setPhase({ kind: "done", questions: phase.questions, score, durationSeconds, timed });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <Result
      questions={phase.questions}
      score={phase.score}
      durationSeconds={phase.durationSeconds}
      timed={phase.timed}
      onRestart={() => setPhase({ kind: "setup" })}
    />
  );
}

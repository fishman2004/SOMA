"use client";

import Link from "next/link";
import { getAllFlashcards, getAvailableTopicRefs, getQuestionIds, getTopic } from "@/content";
import { countPendingErrors, getContinueTopicId, getTopicSteps, getWeekSummary } from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { getReviewQueue, getUnlockedTopics } from "@/lib/spaced-repetition";
import { DAILY_SIZE, dayKey } from "@/lib/daily";
import { ArrowRightIcon, CardsIcon, CheckIcon, ChevronRightIcon, ClockIcon, InfinityIcon, RedoIcon, SheetIcon, SparkIcon, TargetIcon } from "../icons";
import { Card, Segments, Skeleton } from "../ui";

const STEP_TEXT = {
  estudar: "Próxima etapa: ler o resumo e o exemplo",
  praticar: "Próxima etapa: praticar com questões",
  revisar: "Próxima etapa: refazer seus erros",
  concluido: "Etapas concluídas. Revise de novo em outro dia.",
} as const;

export function HomeView() {
  const { state, ready } = useProgress();

  if (!ready) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-52" />
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const topics = getAvailableTopicRefs();
  const continueId = getContinueTopicId(state, topics);
  const topic = continueId ? getTopic(continueId) : undefined;
  const steps = topic ? getTopicSteps(state, topic.id, getQuestionIds(topic.id)) : undefined;
  const doneSteps = steps ? [steps.estudar, steps.praticar, steps.revisar].filter(Boolean).length : 0;
  const isFirstVisit = state.attempts.length === 0 && state.visitedTopics.length === 0;
  const pending = countPendingErrors(state);
  const week = getWeekSummary(state);
  const cardQueue = getReviewQueue(state, getAllFlashcards());
  const cardsToReview = cardQueue.due.length + cardQueue.fresh.length;
  const lastExam = state.exams[state.exams.length - 1];
  const dailyDone = state.daily[dayKey()];
  const progressSheets = state.sheets.length;

  return (
    <>
      {topic && steps ? (
        <section className="flex flex-col gap-3.5 rounded-[20px] bg-primary p-5 text-on-strong">
          <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-hero-muted">
            {isFirstVisit ? "Comece por aqui" : "Continuar de onde parou"}
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-[26px] font-bold">{topic.name}</h2>
            <p className="text-[15px] text-hero-soft">{STEP_TEXT[steps.current]}</p>
          </div>
          <div role="img" aria-label={`${doneSteps} de 3 etapas concluídas`}>
            <Segments total={3} done={doneSteps} doneClass="bg-on-strong" restClass="bg-hero-track" />
          </div>
          <Link
            href={`/estudar/${topic.id}`}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl bg-surface px-5 text-base font-bold text-primary hover:bg-primary-soft"
          >
            {isFirstVisit ? "Começar" : "Continuar"}
            <ArrowRightIcon size={18} />
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="para-hoje" className="flex flex-col gap-2.5">
        <h2 id="para-hoje" className="pt-1 font-display text-lg font-bold">
          Para hoje
        </h2>
        <Shortcut
          href="/desafio"
          title="Desafio do dia"
          tone={dailyDone ? "done" : "primary"}
          icon={dailyDone ? <CheckIcon size={22} /> : <TargetIcon size={22} />}
          text={
            dailyDone
              ? `Feito: ${dailyDone.correct} de ${dailyDone.total}. Amanhã tem outro.`
              : `${DAILY_SIZE} questões de tópicos diferentes, iguais para todo mundo hoje.`
          }
        />
        <Shortcut
          href="/erros"
          title="Revisão de erros"
          tone="error"
          icon={<RedoIcon size={22} />}
          text={
            pending === 0
              ? "Nenhum erro pendente. Quando errar, a questão aparece aqui."
              : pending === 1
                ? "1 erro esperando para ser refeito"
                : `${pending} erros esperando para serem refeitos`
          }
        />
        <Shortcut
          href="/cartoes"
          title="Cartões de memória"
          tone="primary"
          icon={<CardsIcon size={22} />}
          text={
            cardsToReview === 0
              ? getUnlockedTopics(state).length === 0
                ? "Abra um tópico para liberar os cartões dele."
                : "Nenhum cartão para hoje. Você está em dia!"
              : cardsToReview === 1
                ? "1 cartão para revisar hoje"
                : `${cardsToReview} cartões para revisar hoje`
          }
        />
      </section>

      <section aria-labelledby="treinar-mais" className="flex flex-col gap-2.5">
        <h2 id="treinar-mais" className="pt-1 font-display text-lg font-bold">
          Treinar mais
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Tile
            href="/simulado"
            title="Simulado"
            tone="success"
            icon={<ClockIcon size={22} />}
            text={lastExam ? `Último: ${lastExam.correct} de ${lastExam.total}` : "Como na prova"}
          />
          <Tile
            href="/tecnicas"
            title="Cálculo rápido"
            tone="primary"
            icon={<SparkIcon size={22} />}
            text="10 técnicas para treinar"
          />
          <Tile
            href="/provas"
            title="Provas oficiais"
            tone="error"
            icon={<SheetIcon size={22} />}
            text={progressSheets > 0 ? `${progressSheets} corrigida${progressSheets === 1 ? "" : "s"}` : "Corrija as do INEP"}
          />
          <Tile
            href="/gemea"
            title="Questões infinitas"
            tone="primary"
            icon={<InfinityIcon size={22} />}
            text="Números novos a cada vez"
          />
        </div>
      </section>

      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold">Meta da semana</h2>
          <span className="text-sm text-muted">
            {Math.min(week.studyDays, week.goal)} de {week.goal} dias
          </span>
        </div>
        <div
          role="img"
          aria-label={`${week.studyDays} de ${week.goal} dias de estudo nesta semana`}
          className="flex gap-2"
        >
          {Array.from({ length: week.goal }, (_, i) => (
            <div key={i} className={`h-8 flex-1 rounded-lg ${i < week.studyDays ? "bg-success" : "bg-sunken"}`} />
          ))}
        </div>
        <p className="text-sm text-muted">
          {week.studyDays >= week.goal
            ? "Meta cumprida! Descansar também faz parte do aprendizado."
            : "Perdeu um dia? Tudo bem: a meta é semanal, não diária."}
        </p>
      </Card>
    </>
  );
}

type Tone = "primary" | "success" | "error" | "done";

const TONE_ICON: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  error: "bg-error-soft text-error",
  done: "bg-success text-on-strong",
};

/** Atalho em linha: ícone, título, texto e seta. */
function Shortcut({
  href,
  title,
  text,
  icon,
  tone,
}: {
  href: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3.5 rounded-2xl border p-4 ${
        tone === "done" ? "border-success/40 bg-success-soft" : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${TONE_ICON[tone]}`}>{icon}</span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-base font-bold">{title}</span>
        <span className="text-sm text-muted">{text}</span>
      </span>
      <ChevronRightIcon size={20} className="text-muted" />
    </Link>
  );
}

/** Atalho compacto, para grade de duas colunas. */
function Tile({
  href,
  title,
  text,
  icon,
  tone,
}: {
  href: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong"
    >
      <span className={`flex size-11 items-center justify-center rounded-xl ${TONE_ICON[tone]}`}>{icon}</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-bold">{title}</span>
        <span className="text-sm text-muted">{text}</span>
      </span>
    </Link>
  );
}

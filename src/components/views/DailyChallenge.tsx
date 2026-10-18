"use client";

import Link from "next/link";
import { getAllQuestions, getAvailableTopicRefs } from "@/content";
import { dayKey, DAILY_SIZE, pickDailyQuestions, recordDaily } from "@/lib/daily";
import { useProgress } from "@/lib/progress-store";
import { ArrowRightIcon, CheckIcon } from "../icons";
import { BackLink, Skeleton, buttonPrimary, buttonSecondary } from "../ui";
import { PracticeSession } from "./PracticeSession";

/** Questões de hoje, iguais para todos no mesmo dia. */
function todaysQuestions() {
  const key = dayKey();
  const topics = getAvailableTopicRefs().map((t) => t.id);
  return { key, questions: pickDailyQuestions(getAllQuestions(), topics, key) };
}

export function DailyChallenge() {
  const { state, ready, update } = useProgress();
  if (!ready) {
    return (
      <div className="px-5 pt-6" aria-busy="true">
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { key, questions } = todaysQuestions();
  const done = state.daily[key];

  if (done) {
    return (
      <div className="flex flex-col gap-4 px-5 pb-6 pt-6">
        <BackLink href="/">Início</BackLink>
        <span className="flex items-center gap-2 self-start rounded-full bg-success-soft px-3 py-1 text-sm font-bold text-success-strong">
          <CheckIcon size={14} /> Desafio de hoje concluído
        </span>
        <h1 className="font-display text-[28px] font-bold leading-tight">
          {done.correct} de {done.total} hoje
        </h1>
        <p className="leading-relaxed text-muted">
          {done.correct < done.total
            ? "As questões que você errou foram para o caderno de erros. Amanhã tem um desafio novo."
            : "Mandou bem! Amanhã tem um desafio novo."}
        </p>
        {done.correct < done.total ? (
          <Link href="/erros" className={buttonPrimary}>
            Ir para o caderno de erros
            <ArrowRightIcon size={18} />
          </Link>
        ) : null}
        <Link href="/cartoes" className={done.correct < done.total ? buttonSecondary : buttonPrimary}>
          Revisar cartões
          <ArrowRightIcon size={18} />
        </Link>
        <Link href="/tecnicas" className={buttonSecondary}>
          Treinar técnicas de cálculo
        </Link>
      </div>
    );
  }

  return (
    <PracticeSession
      topicName={`Desafio do dia · ${DAILY_SIZE} questões`}
      questions={questions}
      backHref="/"
      allowRestart={false}
      onFinish={(results) =>
        update((s) =>
          recordDaily(s, key, {
            correct: results.filter(Boolean).length,
            total: results.length,
            at: new Date().toISOString(),
          }),
        )
      }
    />
  );
}

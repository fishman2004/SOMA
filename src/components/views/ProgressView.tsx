"use client";

import { getAllFlashcards, getAvailableTopicRefs, getQuestionIds, getTopics, isTopicAvailable } from "@/content";
import { getAchievements } from "@/lib/achievements";
import { CheckIcon } from "../icons";
import Link from "next/link";
import { relativeDay } from "@/lib/dates";
import { formatDuration } from "@/lib/exam";
import { countLearnedCards } from "@/lib/spaced-repetition";
import {
  getTopicMastery,
  getWeekSummary,
  getXp,
  MASTERY_LABELS,
  WEEKLY_GOAL_DAYS,
  XP_PER_LEVEL,
  type MasteryLevel,
} from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { Card, SectionTitle, Skeleton } from "../ui";
import { BackupPanel } from "./BackupPanel";

const LEVEL_STEPS: Record<MasteryLevel, number> = {
  "nao-iniciado": 0,
  praticando: 1,
  consolidando: 2,
  dominado: 3,
};

const LEVEL_COLOR: Record<MasteryLevel, string> = {
  "nao-iniciado": "bg-track",
  praticando: "bg-primary-tint",
  consolidando: "bg-primary",
  dominado: "bg-success",
};

export function ProgressView() {
  const { state, ready } = useProgress();

  if (!ready) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-64" />
        <Skeleton className="h-44" />
      </div>
    );
  }

  const topics = getTopics();
  const week = getWeekSummary(state);
  const maxCount = Math.max(1, ...week.days.map((d) => d.count));
  const xp = getXp(state);
  const weekTotal = week.days.reduce((sum, d) => sum + d.count, 0);
  const totalCards = getAllFlashcards().length;
  const startedCards = Object.keys(state.cards).length;
  const learnedCards = countLearnedCards(state);
  const recentExams = [...state.exams].reverse().slice(0, 3);
  const achievements = getAchievements(state, getAvailableTopicRefs(), WEEKLY_GOAL_DAYS);

  return (
    <>
      <Card className="gap-3.5 p-[18px]">
        <SectionTitle>Domínio em Matemática</SectionTitle>
        <ul className="flex flex-wrap gap-3 text-xs text-muted" aria-label="Legenda dos níveis">
          {(Object.keys(MASTERY_LABELS) as MasteryLevel[]).map((level) => (
            <li key={level} className="inline-flex items-center gap-1">
              <span className={`size-2.5 rounded-[3px] ${LEVEL_COLOR[level]}`} aria-hidden="true" />
              {MASTERY_LABELS[level]}
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-3">
          {topics.map((topic) => {
            const available = isTopicAvailable(topic);
            const m = getTopicMastery(state, topic.id, getQuestionIds(topic.id));
            const filled = LEVEL_STEPS[m.level];
            return (
              <li key={topic.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2 text-[15px]">
                  <span className="font-bold">{topic.name}</span>
                  <span className="text-muted">{available ? MASTERY_LABELS[m.level] : "Em preparação"}</span>
                </div>
                <div className="grid grid-cols-3 gap-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-2 rounded-full ${i < filled ? LEVEL_COLOR[m.level] : "bg-track"}`} />
                  ))}
                </div>
                {available && m.answered > 0 ? (
                  <span className="text-[13px] text-muted">
                    {m.firstTryCorrect} de {m.total} acertos de primeira · {m.answered} de {m.total} questões feitas
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        <details className="text-sm text-muted">
          <summary className="min-h-11 cursor-pointer content-center font-bold text-primary">Como o domínio é calculado?</summary>
          <p className="mt-1 leading-relaxed">
            <strong>Consolidando</strong>: você respondeu todas as questões do tópico e acertou pelo menos 75% de primeira.{" "}
            <strong>Dominado</strong>: além disso, não tem erros pendentes e acertou questões do tópico em dois dias
            diferentes, sinal de que o conteúdo ficou na memória.
          </p>
        </details>
      </Card>

      <Card className="gap-3 p-[18px]">
        <div className="flex items-baseline justify-between">
          <SectionTitle>Esta semana</SectionTitle>
          <span className="text-sm text-muted">questões respondidas</span>
        </div>
        <div
          role="img"
          aria-label={`Questões respondidas por dia nesta semana: ${week.days
            .map((d) => `${d.label} ${d.count}`)
            .join(", ")}`}
          className="grid h-[120px] grid-cols-7 items-end gap-2"
        >
          {week.days.map((d) => (
            <div key={d.label} className="flex h-full flex-col items-center justify-end gap-1">
              {d.count > 0 ? <span className="text-xs text-muted">{d.count}</span> : null}
              <div
                className={`w-full rounded-md ${d.count > 0 ? "bg-primary" : "bg-track"}`}
                style={{ height: d.count > 0 ? `${Math.max(8, (d.count / maxCount) * 90)}px` : "3px" }}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted" aria-hidden="true">
          {week.days.map((d) => (
            <span key={d.label} className={d.isToday ? "font-bold text-ink" : ""}>
              {d.label}
            </span>
          ))}
        </div>
        {weekTotal === 0 ? <p className="text-sm text-muted">Nenhuma questão respondida nesta semana ainda.</p> : null}
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>Cartões de memória</SectionTitle>
        <p className="text-[15px] leading-relaxed">
          <strong className="font-display text-2xl">{learnedCards}</strong>{" "}
          <span className="text-muted">
            de {totalCards} cartões aprendidos · {startedCards} já vistos
          </span>
        </p>
        <p className="text-[13px] text-muted">
          Um cartão conta como aprendido quando você o lembra com facilidade em revisões espaçadas (caixa 3 ou mais).
        </p>
      </Card>

      <Card className="gap-3 p-[18px]">
        <div className="flex items-baseline justify-between">
          <SectionTitle>Conquistas</SectionTitle>
          <span className="text-sm text-muted">
            {achievements.filter((a) => a.earned).length} de {achievements.length}
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          {achievements.map((a) => (
            <li
              key={a.id}
              className={`flex flex-col gap-1 rounded-xl border p-3 ${
                a.earned ? "border-success/40 bg-success-soft" : "border-dashed border-line-strong"
              }`}
            >
              <span className={`flex items-center gap-1.5 text-sm font-bold ${a.earned ? "text-success-strong" : "text-muted"}`}>
                {a.earned ? <CheckIcon size={14} /> : null}
                {a.title}
                <span className="sr-only">{a.earned ? " (conquistada)" : " (ainda não)"}</span>
              </span>
              <span className="text-[13px] leading-snug text-muted">{a.description}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="gap-2.5 p-[18px]">
        <SectionTitle>Simulados</SectionTitle>
        {recentExams.length === 0 ? (
          <p className="text-[15px] text-muted">
            Nenhum simulado ainda.{" "}
            <Link href="/simulado" className="font-bold text-primary underline underline-offset-2">
              Fazer o primeiro
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {recentExams.map((e) => (
              <li key={e.at} className="flex items-baseline justify-between gap-2 py-2 text-[15px]">
                <span>
                  <strong className="font-display text-lg">
                    {e.correct}/{e.total}
                  </strong>{" "}
                  <span className="text-muted">acertos · {formatDuration(e.durationSeconds)}</span>
                </span>
                <span className="text-sm text-muted">{relativeDay(e.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section className="flex items-center gap-3.5 rounded-2xl bg-inverse px-[18px] py-4 text-on-inverse">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-inverse-raised font-display text-xl font-bold">
          {xp.level}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">
            Nível {xp.level} · {xp.xp} XP
          </span>
          <span className="text-sm text-on-inverse-muted">
            Faltam {XP_PER_LEVEL - xp.intoLevel} XP para o próximo nível. XP mede esforço: responder, refletir sobre
            erros, corrigi-los e revisar cartões.
          </span>
        </div>
      </section>

      <BackupPanel />
    </>
  );
}

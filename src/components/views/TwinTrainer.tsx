"use client";

import Link from "next/link";
import { useState } from "react";
import { makeTwin, randomSeed } from "@/content";
import { getTwinStats, TWIN_STREAK_GOAL } from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { QuestionPlayer } from "../QuestionPlayer";
import { ArrowRightIcon } from "../icons";
import { Skeleton, buttonPrimary } from "../ui";

/**
 * Treino com questões gêmeas: a mesma ideia de uma questão, com números
 * novos a cada rodada. A semente é sorteada só no navegador (depois do
 * carregamento), para a página estática não fixar uma questão.
 */
export function TwinTrainer({ generatorId, topicId }: { generatorId: string; topicId: string }) {
  const { ready } = useProgress();
  if (!ready) return <Skeleton className="h-96" />;
  return <Trainer generatorId={generatorId} topicId={topicId} />;
}

function Trainer({ generatorId, topicId }: { generatorId: string; topicId: string }) {
  const { state } = useProgress();
  const [seed, setSeed] = useState(() => randomSeed());
  const question = makeTwin(generatorId, seed);
  const stats = getTwinStats(state, generatorId);
  if (!question) return null;

  return (
    <div className="flex flex-col gap-4">
      <TwinStatsBar answered={stats.answered} correct={stats.correct} streak={stats.streak} />
      <QuestionPlayer
        key={seed}
        question={question}
        mode="gemea"
        renderNext={({ correct }) => (
          <div className="flex flex-col gap-2.5">
            {correct && stats.streak >= TWIN_STREAK_GOAL ? (
              <p className="rounded-xl bg-success-soft p-3.5 text-[15px] font-bold text-success-strong" role="status">
                {stats.streak} acertos seguidos: você pegou a ideia! Continue se quiser, ou volte para o tópico.
              </p>
            ) : null}
            <button
              type="button"
              className={buttonPrimary}
              onClick={() => {
                setSeed(randomSeed());
                window.scrollTo({ top: 0 });
              }}
            >
              Outra questão gêmea
              <ArrowRightIcon size={18} />
            </button>
            <Link
              href={`/estudar/${topicId}`}
              className="inline-flex min-h-11 items-center justify-center font-bold text-primary"
            >
              Voltar para o tópico
            </Link>
          </div>
        )}
      />
    </div>
  );
}

function TwinStatsBar({ answered, correct, streak }: { answered: number; correct: number; streak: number }) {
  const dots = Math.min(streak, TWIN_STREAK_GOAL);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-2" aria-label={`Sequência: ${streak} acertos seguidos`} role="img">
        {Array.from({ length: TWIN_STREAK_GOAL }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`size-3 rounded-full ${i < dots ? "bg-success" : "bg-track"}`}
          />
        ))}
        <span className="text-sm font-bold text-muted">
          {streak >= TWIN_STREAK_GOAL ? "Ideia dominada" : `${streak} de ${TWIN_STREAK_GOAL} seguidas`}
        </span>
      </div>
      <span className="text-sm text-muted">
        {answered === 0 ? "Nenhuma respondida ainda" : `${correct} de ${answered} certas`}
      </span>
    </div>
  );
}

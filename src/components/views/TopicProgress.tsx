"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getQuestionIds } from "@/content";
import { countPendingErrors, getTopicSteps, markTopicVisited, PRACTICE_SIZE } from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { ArrowRightIcon } from "../icons";
import { buttonPrimary } from "../ui";

const STEP_LABELS = [
  { key: "estudar", label: "Estudar" },
  { key: "praticar", label: "Praticar" },
  { key: "revisar", label: "Revisar" },
] as const;

/** Etapas do tópico. Abrir o tópico conta como a etapa "Estudar". */
export function TopicSteps({ topicId }: { topicId: string }) {
  const { state, ready, update } = useProgress();

  useEffect(() => {
    update((s) => markTopicVisited(s, topicId));
  }, [topicId, update]);

  const steps = getTopicSteps(state, topicId, getQuestionIds(topicId));

  return (
    <ol aria-label="Etapas do tópico" className="grid grid-cols-3 gap-1.5">
      {STEP_LABELS.map(({ key, label }) => {
        const done = ready && steps[key];
        const current = ready && steps.current === key;
        return (
          <li key={key} className="flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full ${done ? "bg-success" : current ? "bg-primary" : "bg-track"}`} />
            <span
              className={`text-xs ${
                done ? "font-bold text-success-strong" : current ? "font-bold text-primary-strong" : "text-muted"
              }`}
            >
              {label}
              {done ? " ✓" : ""}
              <span className="sr-only">{done ? " (concluída)" : current ? " (etapa atual)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Botão principal do tópico: muda conforme a etapa em que o estudante está. */
export function TopicAction({ topicId }: { topicId: string }) {
  const { state, ready } = useProgress();
  const ids = getQuestionIds(topicId);
  const steps = getTopicSteps(state, topicId, ids);
  const pending = countPendingErrors(state, topicId);

  if (ready && steps.current === "revisar") {
    return (
      <Link href="/erros" className={`${buttonPrimary} w-full`}>
        Refazer {pending === 1 ? "1 erro" : `${pending} erros`}
        <ArrowRightIcon size={18} />
      </Link>
    );
  }

  return (
    <Link href={`/praticar/${topicId}`} className={`${buttonPrimary} w-full`}>
      {ready && steps.current === "concluido" ? "Praticar de novo" : "Praticar"} · {Math.min(PRACTICE_SIZE, ids.length)} questões
      <ArrowRightIcon size={18} />
    </Link>
  );
}

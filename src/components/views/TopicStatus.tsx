"use client";

import { getQuestionIds } from "@/content";
import { getTopicMastery, getTopicSteps, MASTERY_LABELS } from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { Chip } from "../ui";

/** Situação de um tópico na trilha, a partir do progresso salvo. */
export function TopicStatus({ topicId }: { topicId: string }) {
  const { state, ready } = useProgress();
  if (!ready) return <span className="h-6" aria-hidden="true" />;

  const ids = getQuestionIds(topicId);
  const mastery = getTopicMastery(state, topicId, ids);
  const steps = getTopicSteps(state, topicId, ids);
  const done = [steps.estudar, steps.praticar, steps.revisar].filter(Boolean).length;

  if (mastery.level === "nao-iniciado" && !steps.estudar) return <Chip>Não iniciado</Chip>;
  if (mastery.level === "dominado") return <Chip tone="success">{MASTERY_LABELS.dominado}</Chip>;
  if (steps.current === "concluido") return <Chip tone="success">{MASTERY_LABELS[mastery.level]}</Chip>;
  return <Chip tone="primary">Em andamento · {done} de 3 etapas</Chip>;
}

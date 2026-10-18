"use client";

import { useEffect } from "react";
import { formatDuration } from "@/lib/exam";
import { DRILL_SIZE, markTopicVisited } from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { TECHNIQUES_TOPIC_ID } from "./DrillView";

/** Recorde do treino de uma técnica, para a lista de técnicas. */
export function TechniqueRecord({ techniqueId }: { techniqueId: string }) {
  const { state, ready } = useProgress();
  const record = ready ? state.drills[techniqueId] : undefined;
  if (!record) return <span className="text-[13px] text-muted">Ainda não treinada</span>;
  return (
    <span
      className={`text-[13px] font-bold ${record.bestCorrect === DRILL_SIZE ? "text-success-strong" : "text-primary-strong"}`}
    >
      Recorde: {record.bestCorrect}/{DRILL_SIZE} em {formatDuration(record.bestSeconds)}
    </span>
  );
}

/** Abrir uma técnica conta como estudar o tópico (libera os cartões dele). */
export function MarkTechniquesVisited() {
  const { update } = useProgress();
  useEffect(() => {
    update((s) => markTopicVisited(s, TECHNIQUES_TOPIC_ID));
  }, [update]);
  return null;
}

"use client";

import { useState } from "react";
import type { Question } from "@/content";
import { pickPracticeQuestions } from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { Skeleton } from "../ui";
import { PracticeSession } from "./PracticeSession";

/**
 * Prática de um tópico em rodadas curtas. Cada rodada escolhe as questões
 * a partir do progresso: primeiro as nunca respondidas, depois as erradas
 * e as vistas há mais tempo (veja `pickPracticeQuestions`).
 */
export function TopicPractice({
  topicId,
  topicName,
  questions,
}: {
  topicId: string;
  topicName: string;
  questions: Question[];
}) {
  const { ready } = useProgress();
  const [round, setRound] = useState(0);
  if (!ready) {
    return (
      <div className="px-5 pt-6" aria-busy="true">
        <Skeleton className="h-96" />
      </div>
    );
  }
  return (
    <PracticeRound
      key={round}
      topicId={topicId}
      topicName={topicName}
      questions={questions}
      onRestart={() => {
        setRound((r) => r + 1);
        window.scrollTo({ top: 0 });
      }}
    />
  );
}

function PracticeRound({
  topicId,
  topicName,
  questions,
  onRestart,
}: {
  topicId: string;
  topicName: string;
  questions: Question[];
  onRestart: () => void;
}) {
  const { state } = useProgress();
  // A escolha é feita uma vez, quando a rodada começa.
  const [picked] = useState(() => pickPracticeQuestions(state, questions));
  return <PracticeSession topicId={topicId} topicName={topicName} questions={picked} onRestart={onRestart} />;
}

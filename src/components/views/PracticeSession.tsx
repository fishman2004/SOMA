"use client";

import Link from "next/link";
import { useState } from "react";
import type { Question } from "@/content";
import { QuestionPlayer } from "../QuestionPlayer";
import { ArrowRightIcon, ChevronLeftIcon } from "../icons";
import { Segments, buttonPrimary, buttonSecondary } from "../ui";

/**
 * Sessão de prática de um tópico: uma questão por vez, com feedback,
 * e um resumo no final. Não há "tentar de novo" na hora: refazer um erro
 * depois de ver a resposta não mostra aprendizagem. O erro vai para o
 * caderno e é refeito mais tarde.
 */
export function PracticeSession({
  topicId,
  topicName,
  questions,
}: {
  topicId: string;
  topicName: string;
  questions: Question[];
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const finished = index >= questions.length;
  const total = questions.length;

  function restart() {
    setIndex(0);
    setResults([]);
  }

  const header = (
    <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-line bg-ground px-5 pb-3 pt-2">
      <div className="flex items-center justify-between">
        <Link
          href={`/estudar/${topicId}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-primary hover:text-primary-strong"
        >
          <ChevronLeftIcon size={18} />
          {topicName}
        </Link>
        <span className="text-sm font-bold text-muted" aria-live="polite">
          {finished ? "Resumo" : `Questão ${index + 1} de ${total}`}
        </span>
      </div>
      <Segments total={total} done={results.length} current={finished ? undefined : index} restClass="bg-track" />
    </header>
  );

  if (finished) {
    const correct = results.filter(Boolean).length;
    const wrong = total - correct;
    return (
      <div className="flex min-h-full flex-col">
        {header}
        <div className="flex flex-col gap-4 px-5 pb-6 pt-6">
          <h1 className="font-display text-[28px] font-bold leading-tight">
            Você acertou {correct} de {total} de primeira
          </h1>
          <p className="text-base leading-relaxed text-muted">
            {wrong === 0
              ? "Excelente! Volte em outro dia para ver se o conteúdo ficou na memória: é assim que o tópico chega a dominado."
              : `${wrong === 1 ? "A questão que você errou foi" : `As ${wrong} questões que você errou foram`} para o caderno de erros. Refazer depois de um tempo é o que fixa o aprendizado.`}
          </p>
          <div className="flex flex-col gap-2.5 pt-2">
            {wrong > 0 ? (
              <Link href="/erros" className={buttonPrimary}>
                Ir para o caderno de erros
                <ArrowRightIcon size={18} />
              </Link>
            ) : (
              <Link href="/progresso" className={buttonPrimary}>
                Ver meu progresso
                <ArrowRightIcon size={18} />
              </Link>
            )}
            <button type="button" onClick={restart} className={buttonSecondary}>
              Praticar de novo
            </button>
            <Link href="/estudar" className="inline-flex min-h-11 items-center justify-center font-bold text-primary">
              Voltar para a trilha
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const isLast = index === total - 1;

  return (
    <div className="flex min-h-full flex-col">
      {header}
      <h1 className="sr-only">
        Praticar {topicName}: questão {index + 1} de {total}
      </h1>
      <div className="px-5 pb-6 pt-4">
        <QuestionPlayer
          key={`${question.id}-${results.length}`}
          question={question}
          mode="pratica"
          renderNext={({ correct }) => (
            <button
              type="button"
              className={buttonPrimary}
              onClick={() => {
                setResults((r) => [...r, correct]);
                setIndex((i) => i + 1);
                window.scrollTo({ top: 0 });
              }}
            >
              {isLast ? "Ver resumo" : "Próxima questão"}
              <ArrowRightIcon size={18} />
            </button>
          )}
        />
      </div>
    </div>
  );
}

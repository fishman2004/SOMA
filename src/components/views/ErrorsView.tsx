"use client";

import Link from "next/link";
import { useState } from "react";
import { getQuestion, getTopic, getTwinGeneratorFor } from "@/content";
import { correctAnswerText, givenAnswerText } from "@/lib/answers";
import { relativeDay } from "@/lib/dates";
import { causeLabel, getErrorEntries, type ErrorEntry } from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { CheckIcon, InfinityIcon, RedoIcon } from "../icons";
import { Chip, Skeleton, buttonSmall } from "../ui";

type Tab = "pendente" | "resolvido";

function ErrorCard({ entry }: { entry: ErrorEntry }) {
  const question = getQuestion(entry.questionId);
  if (!question) return null; // questão removida do conteúdo
  const topic = getTopic(entry.topicId);
  const cause = causeLabel(entry.lastWrong.cause);
  const resolved = entry.status === "resolvido";
  const twin = getTwinGeneratorFor(question.id);

  return (
    <article className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <Chip tone="primary">{topic?.name ?? "Tópico"}</Chip>
        <span className="text-[13px] text-muted">errada {relativeDay(entry.lastWrong.at)}</span>
      </div>
      <p className="text-base leading-snug">
        {question.statement} <strong>{question.prompt}</strong>
        {question.table ? <span className="text-muted"> (com tabela de dados)</span> : null}
      </p>
      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex gap-1 text-error-strong">
          <dt>Sua resposta:</dt>
          <dd>{entry.lastWrong.chosenId ? givenAnswerText(question, entry.lastWrong.chosenId) : "sem resposta"}</dd>
        </div>
        <div className="flex gap-1 font-bold text-success-strong">
          <dt>Correta:</dt>
          <dd>{correctAnswerText(question)}</dd>
        </div>
        {cause ? (
          <div className="flex gap-1 text-muted">
            <dt>Causa:</dt>
            <dd>{cause}</dd>
          </div>
        ) : null}
      </dl>
      {resolved ? (
        <div className="flex flex-wrap items-center gap-3">
          <Chip tone="success">
            <CheckIcon size={14} />
            Resolvido
          </Chip>
          <Link
            href={`/revisar/${question.id}`}
            className="inline-flex min-h-11 items-center text-[15px] font-bold text-primary"
          >
            Refazer mesmo assim
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href={`/revisar/${question.id}`} className={buttonSmall}>
            <RedoIcon size={16} strokeWidth={2.4} />
            Refazer
          </Link>
          {twin ? (
            <Link
              href={`/gemea/${twin.id}`}
              className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-primary"
            >
              <InfinityIcon size={18} />
              Treinar com gêmeas
            </Link>
          ) : null}
        </div>
      )}
    </article>
  );
}

export function ErrorsView() {
  const { state, ready } = useProgress();
  const [tab, setTab] = useState<Tab>("pendente");

  if (!ready) return <Skeleton className="h-64" />;

  const entries = getErrorEntries(state);
  const pending = entries.filter((e) => e.status === "pendente");
  const resolved = entries.filter((e) => e.status === "resolvido");
  const visible = tab === "pendente" ? pending : resolved;

  const tabs: { id: Tab; label: string }[] = [
    { id: "pendente", label: `Para refazer (${pending.length})` },
    { id: "resolvido", label: `Resolvidos (${resolved.length})` },
  ];

  return (
    <>
      <div role="tablist" aria-label="Filtrar erros" className="grid grid-cols-2 gap-1 rounded-[14px] bg-sunken p-1">
        {tabs.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`aba-${t.id}`}
              aria-selected={selected}
              aria-controls="painel-erros"
              onClick={() => setTab(t.id)}
              className={`min-h-11 rounded-[10px] text-[15px] ${
                selected ? "bg-surface font-bold text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div id="painel-erros" role="tabpanel" aria-labelledby={`aba-${tab}`} className="flex flex-col gap-4">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-strong p-5 text-center">
            <p className="font-bold">{tab === "pendente" ? "Nada para refazer agora" : "Nenhum erro resolvido ainda"}</p>
            <p className="mt-1 text-[15px] text-muted">
              {tab === "pendente"
                ? entries.length === 0
                  ? "Quando você errar uma questão, ela aparece aqui para revisar depois."
                  : "Você resolveu todos os seus erros. Bom trabalho!"
                : "Refaça uma questão do caderno e acerte para ela aparecer aqui."}
            </p>
            {entries.length === 0 ? (
              <Link href="/estudar" className="mt-3 inline-flex min-h-11 items-center font-bold text-primary">
                Ir para a trilha
              </Link>
            ) : null}
          </div>
        ) : (
          visible.map((entry) => <ErrorCard key={entry.questionId} entry={entry} />)
        )}
      </div>
    </>
  );
}

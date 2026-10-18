"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getEssayGuide } from "@/content";
import { relativeDay } from "@/lib/dates";
import { createDraft, getSelfScore, getTextStats, sortDrafts, upsertDraft } from "@/lib/essay";
import { useEssays } from "@/lib/essay-store";
import { ArrowRightIcon, ChevronRightIcon } from "../icons";
import { Skeleton, buttonPrimary } from "../ui";

function newId(): string {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Cria um rascunho (com ou sem tema) e abre o editor. */
function useStartEssay() {
  const { update } = useEssays();
  const router = useRouter();
  return (theme = "") => {
    const id = newId();
    update((s) => upsertDraft(s, createDraft(id, new Date().toISOString(), theme)));
    router.push(`/redacao/escrever?id=${id}`);
  };
}

export function StartEssayButton() {
  const start = useStartEssay();
  return (
    <button type="button" className={buttonPrimary} onClick={() => start()}>
      Escrever uma redação
      <ArrowRightIcon size={18} />
    </button>
  );
}

export function ThemeList() {
  const start = useStartEssay();
  const { themes } = getEssayGuide();
  return (
    <ul className="flex flex-col gap-2">
      {themes.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            onClick={() => start(t.title)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-left hover:border-primary-tint"
          >
            <span className="text-[15px] font-bold leading-snug">{t.title}</span>
            <ChevronRightIcon size={18} className="shrink-0 text-primary" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function DraftList() {
  const { state, ready } = useEssays();
  if (!ready) return <Skeleton className="h-20" />;
  const drafts = sortDrafts(state.drafts);
  if (drafts.length === 0) {
    return <p className="text-[15px] text-muted">Suas redações aparecem aqui. Elas ficam salvas só neste navegador.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {drafts.map((d) => {
        const stats = getTextStats(d.text);
        const score = getSelfScore(d.levels);
        return (
          <li key={d.id}>
            <Link
              href={`/redacao/escrever?id=${d.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-primary-tint"
            >
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-bold leading-snug">{d.theme.trim() || "Redação sem tema"}</span>
                <span className="text-sm text-muted">
                  {stats.lines} linha{stats.lines === 1 ? "" : "s"} · {stats.words} palavra{stats.words === 1 ? "" : "s"}
                  {score !== undefined ? ` · autoavaliação ${score}` : ""} · editada {relativeDay(d.updatedAt)}
                </span>
              </span>
              <ChevronRightIcon size={18} className="shrink-0 text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

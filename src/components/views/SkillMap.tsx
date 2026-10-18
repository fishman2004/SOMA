"use client";

import Link from "next/link";
import { getQuestionIds, getTopics, getTwinGenerators, isTopicAvailable } from "@/content";
import {
  getSkillStatus,
  getTopicMastery,
  MASTERY_LABELS,
  pickNextSkill,
  SKILL_LABELS,
  TWIN_STREAK_GOAL,
  type SkillLevel,
} from "@/lib/learning";
import { useProgress } from "@/lib/progress-store";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, InfinityIcon, RedoIcon } from "../icons";
import { Skeleton, buttonPrimary } from "../ui";

const LEVEL_ORDER: SkillLevel[] = ["firme", "treinando", "atencao", "nova"];

/** Cor do nó e da barra de cada nível (sempre com texto junto: a cor nunca é a única pista). */
const NODE: Record<SkillLevel, string> = {
  firme: "bg-success text-on-strong border-success",
  treinando: "bg-primary-soft text-primary-strong border-primary",
  atencao: "bg-error-soft text-error-strong border-error",
  nova: "bg-surface text-muted border-line-strong border-dashed",
};

const BAR: Record<SkillLevel, string> = {
  firme: "bg-success",
  treinando: "bg-primary",
  atencao: "bg-error",
  nova: "bg-track",
};

function NodeIcon({ level, index }: { level: SkillLevel; index: number }) {
  if (level === "firme") return <CheckIcon size={18} strokeWidth={2.6} />;
  if (level === "atencao") return <RedoIcon size={17} strokeWidth={2.4} />;
  if (level === "treinando") return <InfinityIcon size={19} />;
  return <span className="font-display text-sm font-bold">{index}</span>;
}

export function SkillMap() {
  const { state, ready } = useProgress();
  if (!ready) return <Skeleton className="h-96" />;

  let counter = 0;
  const regions = getTopics()
    .filter(isTopicAvailable)
    .map((topic) => ({
      topic,
      mastery: getTopicMastery(state, topic.id, getQuestionIds(topic.id)),
      skills: getTwinGenerators(topic.id).map((g) => ({
        id: g.id,
        name: g.name,
        topicName: topic.name,
        index: ++counter,
        ...getSkillStatus(state, { generatorId: g.id, sourceIds: g.sourceIds }),
      })),
    }))
    .filter((r) => r.skills.length > 0);

  const all = regions.flatMap((r) => r.skills);
  const count = (level: SkillLevel) => all.filter((s) => s.level === level).length;
  const next = pickNextSkill(all);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="mapa-resumo" className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <h2 id="mapa-resumo" className="font-display text-[22px] font-bold leading-tight">
          {count("firme")} de {all.length} habilidades firmes
        </h2>
        <div className="flex h-3 overflow-hidden rounded-full bg-track" aria-hidden="true">
          {LEVEL_ORDER.filter((l) => l !== "nova").map((level) =>
            count(level) > 0 ? (
              <span key={level} className={BAR[level]} style={{ width: `${(count(level) / all.length) * 100}%` }} />
            ) : null,
          )}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {LEVEL_ORDER.map((level) => (
            <li key={level} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-3 rounded-full border ${NODE[level]}`} />
              {SKILL_LABELS[level]}: <strong>{count(level)}</strong>
            </li>
          ))}
        </ul>
        {next ? (
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <p className="text-[15px]">
              <span className="text-muted">Sugestão agora: </span>
              <strong>{next.name}</strong>
              <span className="text-muted"> ({next.topicName})</span>
            </p>
            <Link href={`/gemea/${next.id}`} className={buttonPrimary}>
              {next.level === "atencao" ? "Reforçar esta habilidade" : next.level === "nova" ? "Começar esta habilidade" : "Continuar treinando"}
              <ArrowRightIcon size={18} />
            </Link>
          </div>
        ) : (
          <p className="border-t border-line pt-3 text-[15px] font-bold text-success-strong">
            Todas as habilidades estão firmes. Volte em alguns dias para conferir se continuam!
          </p>
        )}
      </section>

      {regions.map(({ topic, mastery, skills }) => (
        <section key={topic.id} aria-labelledby={`regiao-${topic.id}`} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`regiao-${topic.id}`} className="font-display text-lg font-bold">
              <Link href={`/estudar/${topic.id}`} className="hover:text-primary">
                {topic.name}
              </Link>
            </h2>
            <span className="text-sm text-muted">Tópico: {MASTERY_LABELS[mastery.level]}</span>
          </div>
          <ol className="relative flex flex-col gap-2">
            <span aria-hidden="true" className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-line" />
            {skills.map((s) => (
              <li key={s.id} className="relative">
                <Link
                  href={`/gemea/${s.id}`}
                  className="flex min-h-14 items-center gap-3 rounded-2xl border border-transparent px-2 py-2 hover:border-line hover:bg-surface"
                >
                  <span
                    aria-hidden="true"
                    className={`relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 ${NODE[s.level]}`}
                  >
                    <NodeIcon level={s.level} index={s.index} />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-[15px] font-bold">{s.name}</span>
                    <span className="text-sm text-muted">
                      {SKILL_LABELS[s.level]}
                      {s.level === "treinando" && s.bestTwinStreak > 0
                        ? ` · melhor sequência ${s.bestTwinStreak} de ${TWIN_STREAK_GOAL}`
                        : s.answered > 0
                          ? ` · ${s.answered} resposta${s.answered === 1 ? "" : "s"}`
                          : ""}
                    </span>
                  </span>
                  <ChevronRightIcon size={18} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getEssayGuide } from "@/content";
import {
  COMPETENCIES,
  LEVEL_POINTS,
  SHEET_LINES,
  deleteDraft,
  draftToText,
  getLengthStatus,
  getSelfScore,
  getTextStats,
  updateDraft,
  type Competency,
  type EssayDraft,
  type LengthStatus,
} from "@/lib/essay";
import { useEssays } from "@/lib/essay-store";
import { formatClock } from "@/lib/exam";
import { CheckIcon, ClockIcon } from "../icons";
import { Card, SectionTitle, Skeleton, buttonPrimary, buttonSecondary } from "../ui";

const LENGTH_MESSAGE: Record<LengthStatus, { text: string; tone: string }> = {
  vazio: { text: "Comece a escrever: o SOMA mede o tamanho enquanto você digita.", tone: "text-muted" },
  insuficiente: { text: "Até 7 linhas: no ENEM, um texto assim recebe nota zero.", tone: "text-error-strong" },
  curto: { text: "Ainda curto. Redações completas costumam ter de 20 a 30 linhas.", tone: "text-error-strong" },
  bom: { text: "Tamanho dentro do esperado para a folha de 30 linhas.", tone: "text-success-strong" },
  acima: { text: "Passou de 30 linhas e não caberia na folha. Corte repetições.", tone: "text-error-strong" },
};

function nowIso() {
  return new Date().toISOString();
}

export function EssayEditor() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const { state, ready } = useEssays();
  if (!ready) return <Skeleton className="h-96" />;
  const draft = state.drafts.find((d) => d.id === id);
  if (!draft) {
    return (
      <Card className="gap-3 p-[18px]">
        <SectionTitle>Redação não encontrada</SectionTitle>
        <p className="text-[15px] text-muted">
          Ela pode ter sido apagada ou estar salva em outro navegador. As redações ficam só no aparelho em que foram escritas.
        </p>
        <Link href="/redacao" className={buttonPrimary}>
          Voltar ao laboratório
        </Link>
      </Card>
    );
  }
  return <Editor key={draft.id} draft={draft} />;
}

function Editor({ draft }: { draft: EssayDraft }) {
  const { update } = useEssays();
  const guide = getEssayGuide();
  const stats = getTextStats(draft.text);
  const length = getLengthStatus(stats.lines);
  const practice = guide.themes.find((t) => t.title === draft.theme.trim());

  function save(change: Partial<EssayDraft>) {
    update((s) => updateDraft(s, draft.id, change, nowIso()));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-2.5 p-[18px]">
        <label htmlFor="tema" className="font-display text-lg font-bold">
          Tema
        </label>
        <input
          id="tema"
          type="text"
          value={draft.theme}
          onChange={(e) => save({ theme: e.target.value })}
          placeholder="Escreva o tema ou escolha um abaixo"
          className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-3.5 text-base focus:border-primary focus:outline-none"
        />
        <details className="text-[15px]">
          <summary className="min-h-11 cursor-pointer content-center font-bold text-primary">Escolher um tema de treino</summary>
          <ul className="mt-1 flex flex-col gap-1.5">
            {guide.themes.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => save({ theme: t.title })}
                  className="min-h-11 w-full rounded-xl border border-line px-3 py-2 text-left hover:border-primary-tint"
                >
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted">Temas de treino criados pelo SOMA. Não são temas de provas anteriores.</p>
        </details>
        {practice ? (
          <div className="rounded-xl bg-primary-soft p-3.5">
            <p className="text-sm font-bold text-primary-strong">Para pensar antes de escrever</p>
            <ul className="mt-1 list-disc pl-5 text-[15px]">
              {practice.prompts.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2>
            <label htmlFor="texto" className="font-display text-lg font-bold">
              Seu texto
            </label>
          </h2>
          <Timer seconds={draft.seconds} onTick={(seconds) => save({ seconds })} />
        </div>
        <textarea
          id="texto"
          value={draft.text}
          onChange={(e) => save({ text: e.target.value })}
          lang="pt-BR"
          spellCheck
          rows={16}
          aria-describedby="medidas"
          placeholder="Separe os parágrafos com uma linha em branco (Enter)."
          className="min-h-80 w-full resize-y rounded-2xl border-2 border-line-strong bg-surface p-4 text-[17px] leading-[1.7] focus:border-primary focus:outline-none"
        />
        <div id="medidas" className="sticky bottom-[72px] z-[5] flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3.5 md:bottom-3">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Stat label="linhas (estimadas)" value={`${stats.lines}/${SHEET_LINES}`} />
            <Stat label="palavras" value={String(stats.words)} />
            <Stat label="parágrafos" value={String(stats.paragraphs)} />
          </dl>
          <LineMeter lines={stats.lines} />
          <p className={`text-sm font-bold ${LENGTH_MESSAGE[length].tone}`} aria-live="polite">
            {LENGTH_MESSAGE[length].text}
          </p>
        </div>
        <p className="text-sm text-muted">
          A contagem de linhas é uma estimativa (cerca de 72 caracteres por linha manuscrita). Salvo automaticamente neste
          navegador.
        </p>
      </section>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>Como organizar</SectionTitle>
        <ol className="flex flex-col gap-3">
          {guide.structure.map((part, i) => (
            <li key={part.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft font-display font-bold text-primary-strong"
              >
                {i + 1}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-bold">
                  {part.title} <span className="font-normal text-muted">· {part.lines}</span>
                </span>
                <span className="text-[15px] leading-relaxed">{part.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <details className="text-[15px]">
          <summary className="min-h-11 cursor-pointer content-center font-bold text-primary">Conectivos para ligar as ideias</summary>
          <dl className="flex flex-col gap-2">
            {guide.connectives.map((c) => (
              <div key={c.use}>
                <dt className="font-bold">{c.use}</dt>
                <dd className="text-muted">{c.words.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Card>

      <SelfAssessment draft={draft} onSave={save} />

      <DraftActions draft={draft} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="order-2 text-xs text-muted">{label}</dt>
      <dd className="order-1 font-display text-xl font-bold">{value}</dd>
    </div>
  );
}

/** Barra de 30 linhas: a faixa das 7 primeiras marca o mínimo. */
function LineMeter({ lines }: { lines: number }) {
  return (
    <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[2px]" aria-hidden="true">
      {Array.from({ length: SHEET_LINES }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-[2px] ${
            i < lines ? (lines > SHEET_LINES ? "bg-error" : lines < 8 ? "bg-error" : "bg-success") : i < 7 ? "bg-error-soft" : "bg-track"
          }`}
        />
      ))}
    </div>
  );
}

function Timer({ seconds, onTick }: { seconds: number; onTick: (s: number) => void }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(seconds);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  // Salva o tempo a cada 10 segundos e ao pausar.
  useEffect(() => {
    if (elapsed !== seconds && (!running || elapsed % 10 === 0)) onTick(elapsed);
  }, [elapsed, running, seconds, onTick]);

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 font-display text-lg font-bold tabular-nums" aria-label={`Tempo de escrita: ${formatClock(elapsed)}`}>
        <ClockIcon size={18} className="text-muted" />
        {formatClock(elapsed)}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        aria-pressed={running}
        className="min-h-11 rounded-xl border-2 border-line-strong px-3.5 text-[15px] font-bold hover:border-primary"
      >
        {running ? "Pausar" : elapsed > 0 ? "Continuar" : "Cronometrar"}
      </button>
    </div>
  );
}

function SelfAssessment({ draft, onSave }: { draft: EssayDraft; onSave: (change: Partial<EssayDraft>) => void }) {
  const guide = getEssayGuide();
  const score = getSelfScore(draft.levels);
  const evaluated = COMPETENCIES.filter((c) => draft.levels[c] !== undefined);
  const weakest =
    score !== undefined
      ? guide.competencies.reduce((low, c) => ((draft.levels[c.id] ?? 0) < (draft.levels[low.id] ?? 0) ? c : low))
      : undefined;

  function toggle(itemId: string) {
    const checked = draft.checked.includes(itemId) ? draft.checked.filter((x) => x !== itemId) : [...draft.checked, itemId];
    onSave({ checked });
  }

  function setLevel(c: Competency, level: number) {
    onSave({ levels: { ...draft.levels, [c]: level } });
  }

  return (
    <section aria-labelledby="autoavaliacao" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="autoavaliacao" className="font-display text-[22px] font-bold">
          Autoavaliação
        </h2>
        <p className="text-[15px] text-muted">
          Releia o texto com cada roteiro e escolha o nível que você acha que alcançou. Não é nota oficial: serve para
          enxergar onde melhorar.
        </p>
      </div>

      {guide.competencies.map((c) => {
        const level = draft.levels[c.id];
        return (
          <fieldset key={c.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
            <legend className="sr-only">
              Competência {c.id}: {c.title}
            </legend>
            <div aria-hidden="true" className="flex flex-col gap-1">
              <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-primary">Competência {c.id}</span>
              <span className="font-display text-lg font-bold leading-tight">{c.title}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-muted">{c.summary}</p>
            <ul className="flex flex-col gap-1">
              {c.checklist.map((item, i) => {
                const itemId = `${c.id}-${i}`;
                const checked = draft.checked.includes(itemId);
                return (
                  <li key={itemId}>
                    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-1.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(itemId)}
                        className="mt-0.5 size-5 shrink-0 accent-[var(--color-success)]"
                      />
                      <span className={`text-[15px] ${checked ? "text-success-strong" : ""}`}>{item}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold" id={`nivel-${c.id}`}>
                Meu nível nesta competência
              </span>
              <div role="radiogroup" aria-labelledby={`nivel-${c.id}`} className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {guide.levels.map((name, value) => {
                  const selected = level === value;
                  return (
                    <label
                      key={value}
                      className={`flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                        selected ? "border-primary bg-primary-soft text-primary-strong" : "border-line hover:border-primary-tint"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`nivel-${draft.id}-${c.id}`}
                        value={value}
                        checked={selected}
                        onChange={() => setLevel(c.id, value)}
                        className="sr-only"
                      />
                      <span className="font-display text-base font-bold">{value * LEVEL_POINTS}</span>
                      <span className="text-xs leading-tight">{name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </fieldset>
        );
      })}

      <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-primary-tint bg-primary-soft p-4" aria-live="polite">
        {score !== undefined ? (
          <>
            <p className="font-display text-[22px] font-bold text-primary-strong">Sua autoavaliação: {score} de 1000</p>
            {weakest && score < 1000 ? (
              <p className="text-[15px]">
                Na próxima redação, foque na <strong>competência {weakest.id}</strong> ({weakest.title.toLowerCase()}).
              </p>
            ) : (
              <p className="text-[15px]">Você se avaliou com nota máxima. Peça para outra pessoa ler também!</p>
            )}
          </>
        ) : (
          <p className="text-[15px] font-bold text-primary-strong">
            {evaluated.length} de 5 competências avaliadas. Escolha um nível em todas para ver o total.
          </p>
        )}
      </div>
    </section>
  );
}

function DraftActions({ draft }: { draft: EssayDraft }) {
  const { update } = useEssays();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function download() {
    const blob = new Blob([draftToText(draft)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soma-redacao-${draft.createdAt.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-2.5 pt-2">
      <button type="button" onClick={download} className={buttonSecondary} disabled={!draft.text.trim()}>
        Baixar como arquivo de texto
      </button>
      {confirming ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-error p-3.5" role="alert">
          <p className="text-[15px] font-bold text-error-strong">Apagar esta redação? Não dá para desfazer.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                router.push("/redacao");
                update((s) => deleteDraft(s, draft.id));
              }}
              className="min-h-11 rounded-xl bg-error px-4 font-bold text-on-strong"
            >
              Sim, apagar
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-xl border-2 border-line-strong px-4 font-bold">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-11 items-center justify-center font-bold text-error-strong"
        >
          Apagar redação
        </button>
      )}
      <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
        <CheckIcon size={14} />
        Salvo neste navegador
      </p>
    </div>
  );
}

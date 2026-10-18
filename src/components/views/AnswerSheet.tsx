"use client";

import { useState } from "react";
import { formatRanges, gradeSheet, LETTERS, parseAnswerKey, type Letter } from "@/lib/answer-sheet";
import { relativeDay } from "@/lib/dates";
import { createLocalStore } from "@/lib/local-store";
import { useProgress } from "@/lib/progress-store";
import { Card, SectionTitle, buttonPrimary, buttonSecondary } from "../ui";

interface Draft {
  label: string;
  first: number;
  answers: (Letter | null)[];
  key: string;
}

/** Rascunho do cartão, para não perder as marcações ao sair da página. */
const draftStore = createLocalStore<Draft | null>("soma:cartao:v1", null, (saved) => {
  const d = saved as Partial<Draft> | null;
  if (!d || !Array.isArray(d.answers) || typeof d.first !== "number") return null;
  return {
    label: typeof d.label === "string" ? d.label : "",
    first: d.first,
    answers: d.answers.map((a) => (LETTERS.includes(a as Letter) ? (a as Letter) : null)),
    key: typeof d.key === "string" ? d.key : "",
  };
});

const SIZES = [45, 90] as const;

function Setup({ onStart }: { onStart: (draft: Draft) => void }) {
  const [label, setLabel] = useState("");
  const [first, setFirst] = useState("1");
  const [count, setCount] = useState<number>(45);
  const firstNumber = Number(first);
  const valid = Number.isInteger(firstNumber) && firstNumber >= 1 && firstNumber <= 180;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onStart({ label: label.trim(), first: firstNumber, answers: Array(count).fill(null), key: "" });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cartao-nome" className="text-sm font-bold">
          Nome da prova <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="cartao-nome"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex.: ENEM 2023 · 2º dia · Matemática"
          maxLength={80}
          className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-3 text-base focus:border-primary focus:outline-none focus-visible:[outline:3px_solid_var(--color-primary)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cartao-primeira" className="text-sm font-bold">
            Primeira questão
          </label>
          <input
            id="cartao-primeira"
            inputMode="numeric"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            aria-describedby="cartao-primeira-dica"
            className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-3 font-display text-lg focus:border-primary focus:outline-none focus-visible:[outline:3px_solid_var(--color-primary)]"
          />
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-bold">Questões</legend>
          <div className="grid grid-cols-2 gap-2">
            {SIZES.map((n) => (
              <label
                key={n}
                className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-line bg-surface font-bold has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-strong has-[:focus-visible]:[outline:3px_solid_var(--color-primary)]"
              >
                <input type="radio" name="cartao-qtd" className="sr-only" checked={count === n} onChange={() => setCount(n)} />
                {n}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <p id="cartao-primeira-dica" className="text-sm text-muted">
        No ENEM, cada área tem 45 questões. Ex.: Matemática costuma ir da 136 à 180; confira na sua prova.
      </p>
      {!valid ? <p className="text-sm font-bold text-error-strong">Use um número de 1 a 180.</p> : null}
      <button type="submit" className={buttonPrimary} disabled={!valid}>
        Abrir cartão-resposta
      </button>
    </form>
  );
}

export function AnswerSheet() {
  const { state: draft, ready, replace: saveDraft } = draftStore.useStore();
  const { state: progress, update } = useProgress();
  const [result, setResult] = useState<ReturnType<typeof gradeSheet> | null>(null);

  if (!ready) return null;

  const history = [...progress.sheets].reverse().slice(0, 5);

  const historyCard =
    history.length > 0 ? (
      <Card className="gap-2 p-[18px]">
        <SectionTitle>Suas provas corrigidas</SectionTitle>
        <ul className="flex flex-col divide-y divide-line">
          {history.map((s) => (
            <li key={s.at} className="flex items-baseline justify-between gap-3 py-2 text-[15px]">
              <span className="min-w-0">
                <strong className="font-display text-lg">
                  {s.correct}/{s.total}
                </strong>{" "}
                <span className="text-muted">{s.label || `Questões ${s.first} a ${s.first + s.total - 1}`}</span>
              </span>
              <span className="shrink-0 text-sm text-muted">{relativeDay(s.at)}</span>
            </li>
          ))}
        </ul>
      </Card>
    ) : null;

  if (result) {
    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    return (
      <>
        <Card className="gap-3 p-[18px]" >
          <p className="font-display text-[28px] font-bold leading-tight" role="status">
            {result.correct} de {result.total} ({pct}%)
          </p>
          {result.wrong.length > 0 ? (
            <p className="text-[15px]">
              <strong>Erradas:</strong> {formatRanges(result.wrong)}
            </p>
          ) : null}
          {result.blank.length > 0 ? (
            <p className="text-[15px]">
              <strong>Em branco:</strong> {formatRanges(result.blank)}
            </p>
          ) : null}
          {result.annulled.length > 0 ? (
            <p className="text-[15px] text-muted">Anuladas (não contam): {formatRanges(result.annulled)}</p>
          ) : null}
          <p className="rounded-xl bg-primary-soft px-3.5 py-3 text-[15px] leading-relaxed text-primary-strong">
            Volte às questões que errou e anote o assunto de cada uma. Os assuntos que se repetem são os que mais vale a
            pena estudar na trilha.
          </p>
          <button type="button" className={buttonPrimary} onClick={() => setResult(null)}>
            Novo cartão-resposta
          </button>
        </Card>
        {historyCard}
      </>
    );
  }

  if (!draft) {
    return (
      <>
        <Card className="p-[18px]">
          <SectionTitle>Cartão-resposta</SectionTitle>
          <Setup onStart={saveDraft} />
        </Card>
        {historyCard}
      </>
    );
  }

  const key = parseAnswerKey(draft.key);
  const answered = draft.answers.filter((a) => a !== null).length;
  const setAnswer = (i: number, letter: Letter) =>
    saveDraft({ ...draft, answers: draft.answers.map((a, j) => (j === i ? (a === letter ? null : letter) : a)) });

  function grade() {
    if (!draft) return;
    const r = gradeSheet(draft.answers, key, draft.first);
    update((s) => ({
      ...s,
      sheets: [
        ...s.sheets,
        { at: new Date().toISOString(), label: draft.label, total: r.total, correct: r.correct, first: draft.first, wrong: r.wrong },
      ],
    }));
    saveDraft(null);
    setResult(r);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <Card className="gap-3 p-[18px]">
        <div className="flex items-baseline justify-between gap-2">
          <SectionTitle>{draft.label || "Cartão-resposta"}</SectionTitle>
          <span className="shrink-0 text-sm text-muted">
            {answered} de {draft.answers.length} marcadas
          </span>
        </div>
        <p className="text-sm text-muted">Toque na letra que você escolheu. Tocar de novo desmarca.</p>
        <ol className="flex flex-col divide-y divide-line">
          {draft.answers.map((given, i) => {
            const number = draft.first + i;
            return (
              <li key={number} className="flex items-center justify-between gap-2 py-1.5">
                <span id={`q-${number}`} className="w-12 font-display text-base font-bold tabular-nums">
                  {number}
                </span>
                <div role="group" aria-labelledby={`q-${number}`} className="flex gap-1.5">
                  {LETTERS.map((letter) => {
                    const on = given === letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        aria-pressed={on}
                        aria-label={`Questão ${number}, alternativa ${letter}`}
                        onClick={() => setAnswer(i, letter)}
                        className={`size-11 rounded-full border-2 font-display text-[15px] font-bold ${
                          on ? "border-primary bg-primary text-on-strong" : "border-line bg-surface text-ink hover:border-primary-tint"
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="gap-3 p-[18px]">
        <label htmlFor="cartao-gabarito" className="font-display text-lg font-bold">
          Gabarito oficial
        </label>
        <p id="cartao-gabarito-dica" className="text-sm text-muted">
          Cole o gabarito do PDF do INEP (da cor do seu caderno) ou digite as letras em ordem. O SOMA lê só as letras de A a
          E; questões anuladas podem ser marcadas com X.
        </p>
        <textarea
          id="cartao-gabarito"
          rows={4}
          value={draft.key}
          aria-describedby="cartao-gabarito-dica cartao-gabarito-status"
          onChange={(e) => saveDraft({ ...draft, key: e.target.value })}
          className="rounded-xl border-2 border-line-strong bg-surface px-3 py-2 font-display text-base tracking-wider focus:border-primary focus:outline-none focus-visible:[outline:3px_solid_var(--color-primary)]"
        />
        <p
          id="cartao-gabarito-status"
          className={`text-sm ${key.length > 0 && key.length !== draft.answers.length ? "font-bold text-error-strong" : "text-muted"}`}
        >
          {key.length === 0
            ? "Nenhuma letra lida ainda."
            : key.length === draft.answers.length
              ? `${key.length} respostas lidas: certo!`
              : `${key.length} respostas lidas, mas o cartão tem ${draft.answers.length}. Confira se colou o gabarito inteiro e da área certa.`}
        </p>
        <button type="button" className={buttonPrimary} disabled={key.length === 0} onClick={grade}>
          Corrigir
        </button>
        <button
          type="button"
          className={buttonSecondary}
          onClick={() => {
            if (window.confirm("Descartar este cartão-resposta?")) saveDraft(null);
          }}
        >
          Descartar cartão
        </button>
      </Card>
      {historyCard}
    </>
  );
}

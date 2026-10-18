"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/exam";
import { DRILL_SIZE, markTopicVisited, recordDrill, type DrillRecord } from "@/lib/learning";
import { buildDrill, getAlgorithm } from "@/lib/mental-math";
import { parseNumber } from "@/lib/numeric-answer";
import { useProgress } from "@/lib/progress-store";
import { CheckIcon } from "../icons";
import { buttonPrimary, buttonSecondary } from "../ui";

export const TECHNIQUES_TOPIC_ID = "tecnicas-de-calculo";

/** Relógio usado só nos manipuladores de eventos (nunca durante a renderização). */
function clockNow(): number {
  return Date.now();
}

interface DrillResult {
  operands: number[];
  given: number;
  correct: boolean;
}

type Phase =
  | { kind: "idle" }
  | { kind: "running"; problems: number[][] }
  | { kind: "done"; results: DrillResult[]; seconds: number; previous?: DrillRecord };

/**
 * Treino cronometrado de uma técnica: 10 contas, uma por vez.
 * O cronômetro só corre enquanto uma conta está na tela; o tempo lendo a
 * explicação de um erro não conta.
 */
export function DrillView({ techniqueId }: { techniqueId: string }) {
  const algorithm = getAlgorithm(techniqueId)!;
  const { state, ready, update } = useProgress();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<DrillResult[]>([]);
  const [feedback, setFeedback] = useState<"none" | "right" | "wrong">("none");
  const [shownSeconds, setShownSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const elapsedRef = useRef(0); // milissegundos acumulados nas contas já respondidas
  const problemStartRef = useRef(0);

  const record = ready ? state.drills[techniqueId] : undefined;
  const running = phase.kind === "running";

  // Atualiza o relógio na tela enquanto há uma conta aberta.
  useEffect(() => {
    if (!running || feedback === "wrong") return;
    const timer = window.setInterval(() => {
      setShownSeconds(Math.floor((elapsedRef.current + clockNow() - problemStartRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, feedback]);

  function focusInput() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function start() {
    update((s) => markTopicVisited(s, TECHNIQUES_TOPIC_ID));
    elapsedRef.current = 0;
    problemStartRef.current = clockNow();
    setShownSeconds(0);
    setResults([]);
    setIndex(0);
    setInput("");
    setFeedback("none");
    setPhase({ kind: "running", problems: buildDrill(algorithm, DRILL_SIZE) });
    focusInput();
  }

  function finish(all: DrillResult[]) {
    const seconds = Math.round(elapsedRef.current / 1000);
    const previous = state.drills[techniqueId];
    update((s) =>
      recordDrill(s, techniqueId, {
        correct: all.filter((r) => r.correct).length,
        seconds,
        at: new Date().toISOString(),
      }),
    );
    setPhase({ kind: "done", results: all, seconds, previous });
  }

  function next(all: DrillResult[]) {
    if (phase.kind !== "running") return;
    if (all.length >= phase.problems.length) {
      finish(all);
      return;
    }
    setIndex(all.length);
    setInput("");
    setFeedback("none");
    problemStartRef.current = clockNow();
    focusInput();
  }

  function submit() {
    if (phase.kind !== "running" || feedback !== "none") return;
    const value = parseNumber(input);
    if (value === null) return;
    elapsedRef.current += clockNow() - problemStartRef.current;
    const operands = phase.problems[index];
    const correct = value === algorithm.solve(operands).answer;
    const all = [...results, { operands, given: value, correct }];
    setResults(all);
    if (correct) {
      setFeedback("right");
      window.setTimeout(() => next(all), 450);
    } else {
      setFeedback("wrong");
      requestAnimationFrame(() => continueRef.current?.focus());
    }
  }

  /* --------------------------------------------------------------- */

  if (phase.kind === "idle") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[15px] leading-relaxed text-muted">
          {DRILL_SIZE} contas sorteadas para usar a técnica. O relógio só corre enquanto a conta está na tela.
        </p>
        {record ? (
          <p className="rounded-xl bg-primary-soft px-4 py-3 text-[15px] text-primary-strong">
            Seu recorde: <strong>{record.bestCorrect} de {DRILL_SIZE}</strong> em {formatDuration(record.bestSeconds)} ·{" "}
            {record.sessions === 1 ? "1 treino" : `${record.sessions} treinos`}
          </p>
        ) : null}
        <button type="button" className={buttonPrimary} onClick={start}>
          Começar treino
        </button>
      </div>
    );
  }

  if (phase.kind === "done") {
    const correct = phase.results.filter((r) => r.correct).length;
    const wrong = phase.results.filter((r) => !r.correct);
    const prev = phase.previous;
    const isRecord =
      !prev || correct > prev.bestCorrect || (correct === prev.bestCorrect && phase.seconds < prev.bestSeconds);
    return (
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-col gap-1">
          <p className="font-display text-[28px] font-bold leading-tight">
            {correct} de {DRILL_SIZE} em {formatDuration(phase.seconds)}
          </p>
          <p className="text-[15px] text-muted">
            Média de {(phase.seconds / DRILL_SIZE).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s por conta
            {isRecord && prev ? " · novo recorde!" : ""}
            {!prev ? " · primeiro treino desta técnica" : ""}
          </p>
        </div>
        {wrong.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[15px] font-bold">Para revisar</p>
            <ul className="flex flex-col gap-1.5">
              {wrong.map((r, i) => (
                <li key={i} className="rounded-xl bg-surface px-3.5 py-2.5 text-[15px]">
                  {algorithm.format(r.operands)} = <strong>{algorithm.solve(r.operands).answer.toLocaleString("pt-BR")}</strong>{" "}
                  <span className="text-muted">(você respondeu {r.given.toLocaleString("pt-BR")})</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 font-bold text-success-strong">
            <CheckIcon size={18} />
            Nenhum erro. Tente bater o seu tempo!
          </p>
        )}
        <button type="button" className={buttonPrimary} onClick={start}>
          Treinar de novo
        </button>
      </div>
    );
  }

  const operands = phase.problems[index];
  const solution = algorithm.solve(operands);
  const last = results[results.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm font-bold text-muted">
        <span>
          Conta {index + 1} de {phase.problems.length}
        </span>
        <span className="rounded-full bg-surface px-3 py-1 font-display tabular-nums text-ink" aria-hidden="true">
          {formatDuration(shownSeconds)}
        </span>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="treino-resposta" className="text-center font-display text-[34px] font-bold leading-tight">
          {algorithm.format(operands)} = ?
        </label>
        <input
          id="treino-resposta"
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={input}
          disabled={feedback !== "none"}
          onChange={(e) => setInput(e.target.value)}
          className={`min-h-14 rounded-[14px] border-2 bg-surface px-4 text-center font-display text-2xl focus:outline-none focus-visible:[outline:3px_solid_var(--color-primary)] ${
            feedback === "right"
              ? "border-success bg-success-soft"
              : feedback === "wrong"
                ? "border-error bg-error-soft"
                : "border-line-strong focus:border-primary"
          }`}
        />
        {feedback === "none" ? (
          <button type="submit" className={buttonPrimary} disabled={parseNumber(input) === null}>
            Responder
          </button>
        ) : null}
      </form>

      <div aria-live="polite">
        {feedback === "right" ? (
          <p className="flex items-center justify-center gap-2 font-bold text-success-strong">
            <CheckIcon size={18} /> Certo!
          </p>
        ) : null}
        {feedback === "wrong" && last ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-error/40 bg-error-soft p-4">
            <p className="font-display text-lg font-bold text-error-strong">
              Era {solution.answer.toLocaleString("pt-BR")}. Veja o caminho:
            </p>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
              {solution.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <button ref={continueRef} type="button" className={buttonSecondary} onClick={() => next(results)}>
              {results.length >= phase.problems.length ? "Ver resultado" : "Continuar"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

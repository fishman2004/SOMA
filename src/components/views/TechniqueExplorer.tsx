"use client";

import { useId, useState } from "react";
import { getAlgorithm } from "@/lib/mental-math";
import { parseNumber } from "@/lib/numeric-answer";
import { LinesDiagram } from "../LinesDiagram";
import { buttonSecondary } from "../ui";

/**
 * "Experimente": o estudante escolhe os números (ou sorteia) e vê a
 * técnica resolvida passo a passo, com o desenho quando houver.
 */
export function TechniqueExplorer({ techniqueId }: { techniqueId: string }) {
  const algorithm = getAlgorithm(techniqueId)!;
  const baseId = useId();
  const [values, setValues] = useState<string[]>(() => algorithm.example.map(String));

  const operands = values.map((v) => parseNumber(v));
  const filled = operands.every((n): n is number => n !== null);
  const problem = filled ? (operands as number[]) : null;
  const error = problem ? algorithm.check(problem) : "Preencha os números.";
  const solution = problem && !error ? algorithm.solve(problem) : null;

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => e.preventDefault()}
        aria-describedby={`${baseId}-status`}
      >
        <div className={`grid gap-3 ${algorithm.inputs.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {algorithm.inputs.map((label, i) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label htmlFor={`${baseId}-${i}`} className="text-sm font-bold">
                {label}
              </label>
              <input
                id={`${baseId}-${i}`}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={values[i]}
                onChange={(e) => setValues((list) => list.map((v, j) => (j === i ? e.target.value : v)))}
                className="min-h-12 rounded-xl border-2 border-line-strong bg-surface px-3 font-display text-xl focus:border-primary focus:outline-none focus-visible:[outline:3px_solid_var(--color-primary)]"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={buttonSecondary}
          onClick={() => setValues(algorithm.generate(Math.random).map(String))}
        >
          Sortear outro exemplo
        </button>
      </form>

      <div id={`${baseId}-status`} aria-live="polite" className="flex flex-col gap-4">
        {solution && problem ? (
          <>
            <p className="font-display text-2xl font-bold">
              {algorithm.format(problem)} = {solution.answer.toLocaleString("pt-BR")}
            </p>
            {algorithm.visual === "linhas" ? <LinesDiagram a={problem[0]} b={problem[1]} /> : null}
            <ol className="flex flex-col gap-2.5">
              {solution.steps.map((step, i) => (
                <li key={i} className="flex gap-3 rounded-xl bg-surface p-3 text-[15px] leading-relaxed">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary-strong"
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="rounded-xl bg-error-soft px-4 py-3 text-[15px] text-error-strong">{error}</p>
        )}
      </div>
    </div>
  );
}

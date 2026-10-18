"use client";

import { useMemo, useState } from "react";
import {
  getAllFlashcards,
  getAllQuestions,
  getFlashcard,
  getQuestion,
  getTechniqueText,
  getTechniqueTexts,
  getTopic,
  getTopics,
  type Question,
} from "@/content";
import { createLocalStore } from "@/lib/local-store";
import { getAlgorithm } from "@/lib/mental-math";
import { formatWithUnit } from "@/lib/numeric-answer";
import {
  buildReviewItems,
  exportReview,
  KIND_LABEL,
  parseReviewState,
  setComment,
  setVerdict,
  summarize,
  type ReviewItem,
  type ReviewState,
  type ReviewVerdict,
} from "@/lib/review";
import { DataTableView } from "../DataTableView";
import { CheckIcon } from "../icons";
import { DIFFICULTY_LABEL } from "../QuestionPlayer";
import { Card, buttonSecondary } from "../ui";

const reviewStore = createLocalStore<ReviewState>("soma:revisao:v1", {}, parseReviewState);

const ITEMS = buildReviewItems(
  getTopics(),
  getAllQuestions(),
  getAllFlashcards(),
  getTechniqueTexts(),
  "tecnicas-de-calculo",
);

type StatusFilter = "todos" | "pendentes" | "ajustar" | "ok";

/* ------------------------------------------------------------------ */
/* Conteúdo de cada item                                               */
/* ------------------------------------------------------------------ */

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">{children}</span>;
}

function QuestionBody({ q }: { q: Question }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
      <p>{q.statement}</p>
      {q.table ? <DataTableView table={q.table} /> : null}
      <p className="font-bold">{q.prompt}</p>
      {q.kind === "numerica" ? (
        <p>
          <Label>Resposta</Label>{" "}
          <strong className="text-success-strong">{formatWithUnit(q.answer, q.prefix, q.unit)}</strong>
          {q.tolerance ? <span className="text-muted"> (aceita diferença de até {q.tolerance})</span> : null}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {q.alternatives.map((a) => (
            <li
              key={a.id}
              className={a.id === q.correctId ? "font-bold text-success-strong" : ""}
            >
              {a.id}) {a.text}
              {a.id === q.correctId ? " ✓ gabarito" : ""}
              {q.trap?.alternativeId === a.id ? <span className="font-normal text-muted"> (armadilha)</span> : null}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-1">
        <Label>Raciocínio</Label>
        {q.reasoning.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
        <span>{q.explanation}</span>
      </div>
      {q.kind === "multipla-escolha" && q.trap ? (
        <p>
          <Label>Armadilha</Label> {q.trap.explanation}
        </p>
      ) : null}
      {q.kind === "numerica" && q.commonMistakes?.length ? (
        <div className="flex flex-col gap-1">
          <Label>Erros previstos</Label>
          {q.commonMistakes.map((m) => (
            <span key={m.value}>
              <strong>{formatWithUnit(m.value, q.prefix, q.unit)}:</strong> {m.explanation}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-sm text-muted">{DIFFICULTY_LABEL[q.difficulty]}</p>
    </div>
  );
}

function ItemBody({ item }: { item: ReviewItem }) {
  if (item.kind === "questao") {
    const q = getQuestion(item.id);
    return q ? <QuestionBody q={q} /> : null;
  }
  if (item.kind === "cartao") {
    const c = getFlashcard(item.id);
    if (!c) return null;
    return (
      <dl className="flex flex-col gap-2 text-[15px] leading-relaxed">
        <div>
          <dt><Label>Frente</Label></dt>
          <dd className="font-bold">{c.front}</dd>
        </div>
        <div>
          <dt><Label>Verso</Label></dt>
          <dd>{c.back}</dd>
        </div>
      </dl>
    );
  }
  if (item.kind === "topico") {
    const t = getTopic(item.id);
    if (!t?.content) return null;
    return (
      <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
        <p>{t.content.keyIdea}</p>
        <ul className="flex flex-col gap-1">
          {t.content.formulas.map((f) => (
            <li key={f.label}>
              <strong>{f.label}:</strong> {f.expression}
            </li>
          ))}
        </ul>
        {t.content.warning ? (
          <p>
            <Label>Atenção</Label> {t.content.warning}
          </p>
        ) : null}
        {t.content.example ? (
          <p>
            <Label>Exemplo</Label> {t.content.example.statement} → {t.content.example.solution}
          </p>
        ) : null}
      </div>
    );
  }
  const text = getTechniqueText(item.id);
  const algorithm = getAlgorithm(item.id);
  if (!text || !algorithm) return null;
  const solution = algorithm.solve(algorithm.example);
  return (
    <div className="flex flex-col gap-2 text-[15px] leading-relaxed">
      <p className="font-bold">
        {text.name}
        {text.nickname ? ` (${text.nickname})` : ""}: {text.tagline}
      </p>
      <p>
        <Label>Exemplo</Label> {algorithm.format(algorithm.example)} = {solution.answer.toLocaleString("pt-BR")}.{" "}
        {solution.steps.join(" ")}
      </p>
      <p>
        <Label>Por que funciona</Label> {text.why}
      </p>
      <p>
        <Label>Quando usar</Label> {text.when}
      </p>
      <p>
        <Label>De onde vem</Label> {text.origin}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ReviewCard({
  item,
  entry,
  onVerdict,
  onComment,
}: {
  item: ReviewItem;
  entry?: ReviewState[string];
  onVerdict: (v: ReviewVerdict | null) => void;
  onComment: (text: string) => void;
}) {
  const commentId = `comentario-${item.key}`;
  const verdictButton = (v: ReviewVerdict, label: string, onTone: string) => {
    const on = entry?.verdict === v;
    return (
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onVerdict(on ? null : v)}
        className={`min-h-11 rounded-xl border-2 px-3 text-sm font-bold ${
          on ? onTone : "border-line bg-surface text-ink hover:border-line-strong"
        }`}
      >
        {on && v === "ok" ? <CheckIcon size={14} className="mr-1 inline" /> : null}
        {label}
      </button>
    );
  };

  return (
    <article
      aria-labelledby={`titulo-${item.key}`}
      className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 ${
        entry?.verdict === "ok"
          ? "border-success/50"
          : entry?.verdict === "ajustar"
            ? "border-error/50"
            : "border-line"
      }`}
    >
      <h2 id={`titulo-${item.key}`} className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-bold">
          {KIND_LABEL[item.kind]} <span className="font-normal text-muted">· {item.id}</span>
        </span>
      </h2>
      <ItemBody item={item} />
      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        {verdictButton("ok", "Está certo", "border-success bg-success-soft text-success-strong")}
        {verdictButton("ajustar", "Precisa de ajuste", "border-error bg-error-soft text-error-strong")}
      </div>
      <label htmlFor={commentId} className="text-sm font-bold">
        Comentário <span className="font-normal text-muted">(o que mudar, ou uma sugestão)</span>
      </label>
      <textarea
        id={commentId}
        rows={2}
        value={entry?.comment ?? ""}
        onChange={(e) => onComment(e.target.value)}
        className="rounded-xl border-2 border-line-strong bg-surface px-3 py-2 text-[15px] focus:border-primary focus:outline-none focus-visible:[outline:3px_solid_var(--color-primary)]"
      />
    </article>
  );
}

export function ReviewView() {
  const { state, ready, update, replace } = reviewStore.useStore();
  const [topicFilter, setTopicFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pendentes");
  // Itens mexidos agora continuam na lista até o filtro mudar: assim o cartão
  // não some no meio da digitação de um comentário.
  const [touched, setTouched] = useState<string[]>([]);
  const touch = (key: string) => setTouched((list) => (list.includes(key) ? list : [...list, key]));
  const topics = useMemo(() => getTopics().filter((t) => t.content), []);

  const summary = summarize(state, ITEMS);
  const visible = ITEMS.filter((item) => {
    if (topicFilter !== "todos" && item.topicId !== topicFilter) return false;
    if (touched.includes(item.key)) return true;
    const v = state[item.key]?.verdict;
    if (statusFilter === "pendentes") return !v;
    if (statusFilter === "ajustar") return v === "ajustar";
    if (statusFilter === "ok") return v === "ok";
    return true;
  });

  function download() {
    const blob = new Blob([exportReview(state, ITEMS)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soma-revisao-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const now = () => new Date().toISOString();
  const done = summary.ok + summary.adjust;

  return (
    <>
      <Card className="gap-3 p-[18px]">
        <p className="font-display text-xl font-bold">
          {ready ? done : 0} de {summary.total} itens revisados
        </p>
        <div className="flex h-2 overflow-hidden rounded-full bg-track" aria-hidden="true">
          <div className="bg-success" style={{ width: `${(summary.ok / summary.total) * 100}%` }} />
          <div className="bg-error" style={{ width: `${(summary.adjust / summary.total) * 100}%` }} />
        </div>
        <p className="text-sm text-muted">
          {summary.ok} certos · {summary.adjust} precisam de ajuste · {summary.pending} pendentes
        </p>
        <div className="grid gap-2 min-[400px]:grid-cols-2">
          <button type="button" className={buttonSecondary} onClick={download} disabled={done === 0}>
            Baixar revisão
          </button>
          <button
            type="button"
            className={buttonSecondary}
            disabled={done === 0}
            onClick={() => {
              if (window.confirm("Apagar toda a revisão feita neste navegador?")) replace({});
            }}
          >
            Apagar revisão
          </button>
        </div>
      </Card>

      <div className="grid gap-3 min-[400px]:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro-topico" className="text-sm font-bold">
            Tópico
          </label>
          <select
            id="filtro-topico"
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value);
              setTouched([]);
            }}
            className="min-h-11 rounded-xl border-2 border-line-strong bg-surface px-3 text-[15px] font-normal"
          >
            <option value="todos">Todos os tópicos</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro-status" className="text-sm font-bold">
            Mostrar
          </label>
          <select
            id="filtro-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setTouched([]);
            }}
            className="min-h-11 rounded-xl border-2 border-line-strong bg-surface px-3 text-[15px] font-normal"
          >
            <option value="pendentes">Pendentes</option>
            <option value="ajustar">Precisam de ajuste</option>
            <option value="ok">Certos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {visible.length === 1 ? "1 item" : `${visible.length} itens`} nesta lista
      </p>

      <div className="flex flex-col gap-3">
        {visible.map((item) => (
          <ReviewCard
            key={item.key}
            item={item}
            entry={state[item.key]}
            onVerdict={(v) => {
              touch(item.key);
              update((s) => setVerdict(s, item.key, v, now()));
            }}
            onComment={(text) => {
              touch(item.key);
              update((s) => setComment(s, item.key, text, now()));
            }}
          />
        ))}
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong p-5 text-center text-muted">
            Nada nesta lista. Troque o filtro para ver outros itens.
          </p>
        ) : null}
      </div>
    </>
  );
}

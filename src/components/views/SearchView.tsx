"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MIN_QUERY_LENGTH, search, type SearchEntry, type SearchKind } from "@/lib/search";
import { BookIcon, CardsIcon, ChevronRightIcon, InfinityIcon, SearchIcon, SparkIcon, TargetIcon } from "../icons";

const KIND: Record<SearchKind, { label: string; Icon: typeof BookIcon; tone: string }> = {
  pagina: { label: "Seção do SOMA", Icon: ChevronRightIcon, tone: "bg-primary text-on-strong" },
  topico: { label: "Tópico", Icon: BookIcon, tone: "bg-primary-soft text-primary" },
  tecnica: { label: "Técnica", Icon: SparkIcon, tone: "bg-primary-soft text-primary" },
  gemea: { label: "Questões infinitas", Icon: InfinityIcon, tone: "bg-success-soft text-success" },
  cartao: { label: "Cartão", Icon: CardsIcon, tone: "bg-error-soft text-error" },
  questao: { label: "Questão", Icon: TargetIcon, tone: "border border-line bg-ground text-muted" },
};

const SUGGESTIONS = ["redação", "desconto", "regra de três", "média", "método chinês", "escala", "raiz", "vezes 11"];

export function SearchView({ entries }: { entries: SearchEntry[] }) {
  const params = useSearchParams();
  const paramQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(paramQuery);
  const [lastParam, setLastParam] = useState(paramQuery);

  // Se a página for aberta de novo com outro ?q= (ex.: pela busca do início), segue o link.
  if (paramQuery !== lastParam) {
    setLastParam(paramQuery);
    setQuery(paramQuery);
  }

  const results = useMemo(() => search(entries, query), [entries, query]);
  const active = query.trim().length >= MIN_QUERY_LENGTH;

  function change(value: string) {
    setQuery(value);
    const url = value.trim() ? `/buscar?q=${encodeURIComponent(value)}` : "/buscar";
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="flex flex-col gap-4">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
        <label htmlFor="busca" className="sr-only">
          Buscar no SOMA
        </label>
        <SearchIcon size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="busca"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => change(e.target.value)}
          placeholder="Ex.: desconto, mediana, método chinês"
          className="min-h-13 w-full rounded-2xl border-2 border-line-strong bg-surface py-3 pl-12 pr-4 text-base placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </form>

      <p className="sr-only" aria-live="polite">
        {active ? `${results.length} resultado${results.length === 1 ? "" : "s"}` : ""}
      </p>

      {!active ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-[15px] text-muted">Busque seções, tópicos, técnicas, cartões e questões. Algumas ideias:</p>
          <ul className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => change(s)}
                  className="min-h-11 rounded-full border border-line bg-surface px-4 text-[15px] hover:border-primary-tint"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
          <p className="font-bold">Nada encontrado para “{query.trim()}”.</p>
          <p className="text-[15px] text-muted">
            Tente uma palavra mais curta ou um sinônimo. Por enquanto, o SOMA tem conteúdo de Matemática.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Resultados da busca">
          {results.map((r) => {
            const { label, Icon, tone } = KIND[r.kind];
            return (
              <li key={r.id}>
                <Link
                  href={r.href}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 hover:border-primary-tint"
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-muted">
                      {label}
                      {r.context ? ` · ${r.context}` : ""}
                    </span>
                    <span className="text-[15px] font-bold leading-snug">{r.title}</span>
                    {r.snippet ? <span className="text-sm leading-snug text-muted">{r.snippet}</span> : null}
                  </span>
                  <ChevronRightIcon size={18} className="mt-2.5 shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

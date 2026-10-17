import Link from "next/link";
import type { ReactNode } from "react";
import type { Source } from "@/content";
import { ChevronLeftIcon, CheckIcon } from "./icons";

/* Peças visuais reutilizadas em várias telas. */

export function PageTitle({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {eyebrow ? (
        <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">{eyebrow}</span>
      ) : null}
      <h1 className="font-display text-[28px] font-bold leading-tight">{title}</h1>
      {intro ? <p className="text-[15px] leading-relaxed text-muted">{intro}</p> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-lg font-bold">{children}</h2>;
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-bold text-primary hover:text-primary-strong"
    >
      <ChevronLeftIcon size={18} />
      {children}
    </Link>
  );
}

type ChipTone = "primary" | "success" | "error" | "neutral";

const CHIP_TONES: Record<ChipTone, string> = {
  primary: "bg-primary-soft text-primary-strong font-bold",
  success: "bg-success-soft text-success-strong font-bold",
  error: "bg-error-soft text-error-strong font-bold",
  neutral: "border border-line bg-surface text-muted",
};

export function Chip({ tone = "neutral", children }: { tone?: ChipTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-[13px] ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Mostra de onde veio o conteúdo e se ele já passou por revisão humana. */
export function SourceBadge({ source }: { source: Source }) {
  const reviewed = source.reviewStatus === "revisado";
  return (
    <Chip tone={reviewed ? "success" : "neutral"}>
      {reviewed ? <CheckIcon size={14} /> : null}
      {source.label}
      {reviewed ? " · revisado" : source.reviewStatus === "aguardando-revisao" ? " · aguardando revisão" : " · rascunho"}
    </Chip>
  );
}

/** Barra dividida em etapas. */
export function Segments({
  total,
  done,
  current,
  doneClass = "bg-primary",
  currentClass = "bg-primary",
  restClass = "bg-track",
  height = "h-1.5",
}: {
  total: number;
  done: number;
  current?: number;
  doneClass?: string;
  currentClass?: string;
  restClass?: string;
  height?: string;
}) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`${height} flex-1 rounded-full ${i < done ? doneClass : i === current ? currentClass : restClass}`}
        />
      ))}
    </div>
  );
}

/** Espaço reservado enquanto o progresso salvo é carregado. */
export function Skeleton({ className = "h-24" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-track/60 ${className}`} />;
}

export const buttonPrimary =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-[17px] font-bold text-on-strong hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-track disabled:text-muted";

export const buttonSecondary =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] border-2 border-primary bg-surface px-5 text-base font-bold text-primary hover:bg-primary-soft";

export const buttonSmall =
  "inline-flex min-h-11 items-center gap-1.5 self-start rounded-xl bg-primary px-4 text-[15px] font-bold text-on-strong hover:bg-primary-strong";

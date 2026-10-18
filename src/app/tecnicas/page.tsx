import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ChevronRightIcon } from "@/components/icons";
import { BackLink, PageTitle } from "@/components/ui";
import { MarkTechniquesVisited, TechniqueRecord } from "@/components/views/TechniqueBits";
import { getTechniquesIntro, getTechniqueTexts } from "@/content";

export const metadata: Metadata = { title: "Técnicas de cálculo rápido" };

export default function TechniquesPage() {
  const techniques = getTechniqueTexts();

  return (
    <AppShell nav="estudar">
      <MarkTechniquesVisited />
      <BackLink href="/estudar/tecnicas-de-calculo">Tópico: Técnicas de cálculo</BackLink>
      <PageTitle eyebrow="Laboratório" title="Técnicas de cálculo rápido" intro={getTechniquesIntro()} />

      <ol className="flex flex-col gap-2.5">
        {techniques.map((t, i) => (
          <li key={t.id}>
            <Link
              href={`/tecnicas/${t.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 hover:border-primary-tint"
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-display text-base font-bold text-primary-strong"
              >
                {i + 1}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-base font-bold">
                  {t.name}
                  {t.nickname ? <span className="font-normal text-muted"> · {t.nickname}</span> : null}
                </span>
                <span className="text-sm text-muted">{t.tagline}</span>
                <TechniqueRecord techniqueId={t.id} />
              </span>
              <ChevronRightIcon size={20} className="shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ol>
    </AppShell>
  );
}

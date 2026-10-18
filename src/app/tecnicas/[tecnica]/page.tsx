import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ArrowRightIcon } from "@/components/icons";
import { BackLink, Card, PageTitle, SectionTitle, SourceBadge } from "@/components/ui";
import { DrillView } from "@/components/views/DrillView";
import { MarkTechniquesVisited } from "@/components/views/TechniqueBits";
import { TechniqueExplorer } from "@/components/views/TechniqueExplorer";
import { getTechniqueText, getTechniqueTexts } from "@/content";

export function generateStaticParams() {
  return getTechniqueTexts().map((t) => ({ tecnica: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/tecnicas/[tecnica]">): Promise<Metadata> {
  const { tecnica } = await params;
  return { title: getTechniqueText(tecnica)?.name ?? "Técnica" };
}

export default async function TechniquePage({ params }: PageProps<"/tecnicas/[tecnica]">) {
  const { tecnica } = await params;
  const technique = getTechniqueText(tecnica);
  if (!technique) notFound();

  const all = getTechniqueTexts();
  const position = all.findIndex((t) => t.id === technique.id);
  const nextTechnique = all[position + 1];

  return (
    <AppShell nav="estudar">
      <MarkTechniquesVisited />
      <BackLink href="/tecnicas">Todas as técnicas</BackLink>

      <div className="flex flex-col gap-2">
        <PageTitle
          eyebrow={`Técnica ${position + 1} de ${all.length}${technique.nickname ? ` · ${technique.nickname}` : ""}`}
          title={technique.name}
          intro={technique.tagline}
        />
        <SourceBadge source={technique.source} />
      </div>

      <Card className="p-[18px]">
        <SectionTitle>Passo a passo</SectionTitle>
        <p className="text-[15px] text-muted">Troque os números para ver a técnica com outros exemplos.</p>
        <TechniqueExplorer techniqueId={technique.id} />
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>Por que funciona</SectionTitle>
        <p className="text-base leading-relaxed">{technique.why}</p>
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>Quando usar</SectionTitle>
        <p className="text-base leading-relaxed">{technique.when}</p>
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>De onde vem</SectionTitle>
        <p className="text-[15px] leading-relaxed text-muted">{technique.origin}</p>
      </Card>

      <Card className="p-[18px]">
        <SectionTitle>Treino cronometrado</SectionTitle>
        <DrillView techniqueId={technique.id} />
      </Card>

      {nextTechnique ? (
        <Link
          href={`/tecnicas/${nextTechnique.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-primary-tint"
        >
          <span className="flex flex-col">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-muted">Próxima técnica</span>
            <span className="text-base font-bold">{nextTechnique.name}</span>
          </span>
          <ArrowRightIcon size={20} className="text-primary" />
        </Link>
      ) : null}
    </AppShell>
  );
}

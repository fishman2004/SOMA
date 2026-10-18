import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BackLink, Card, PageTitle, SectionTitle, SourceBadge } from "@/components/ui";
import { DraftList, StartEssayButton, ThemeList } from "@/components/views/EssayLab";
import { getEssayGuide } from "@/content";

export const metadata: Metadata = { title: "Laboratório de redação" };

export default function EssayLabPage() {
  const guide = getEssayGuide();

  return (
    <AppShell nav="estudar">
      <BackLink href="/">Início</BackLink>
      <div className="flex flex-col gap-2">
        <PageTitle eyebrow="Redação · ENEM" title="Laboratório de redação" intro={guide.intro} />
        <SourceBadge source={guide.source} />
      </div>

      <StartEssayButton />

      <section aria-labelledby="minhas-redacoes" className="flex flex-col gap-2.5">
        <h2 id="minhas-redacoes" className="font-display text-lg font-bold">
          Minhas redações
        </h2>
        <DraftList />
      </section>

      <section aria-labelledby="temas" className="flex flex-col gap-2.5">
        <h2 id="temas" className="font-display text-lg font-bold">
          Temas de treino
        </h2>
        <p className="text-[15px] text-muted">Criados pelo SOMA para praticar. Não são temas de provas anteriores.</p>
        <ThemeList />
      </section>

      <Card className="gap-3 p-[18px]">
        <SectionTitle>As 5 competências</SectionTitle>
        <p className="text-[15px] text-muted">
          A correção olha 5 competências, cada uma valendo de 0 a 200 pontos, em níveis de 40 em 40. O total vai até 1000.
        </p>
        <ol className="flex flex-col gap-3">
          {guide.competencies.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft font-display font-bold text-primary-strong"
              >
                {c.id}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-bold">{c.title}</span>
                <span className="text-[15px] leading-relaxed text-muted">{c.summary}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="gap-2 p-[18px]">
        <SectionTitle>O que zera a redação</SectionTitle>
        <ul className="list-disc pl-5 text-[15px] leading-relaxed">
          {guide.zeroCauses.map((z) => (
            <li key={z}>{z}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">{guide.officialHint}</p>
      </Card>
    </AppShell>
  );
}

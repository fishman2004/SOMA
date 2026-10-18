import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ChevronRightIcon } from "@/components/icons";
import { BackLink, PageTitle, SectionTitle } from "@/components/ui";
import { getTopics, getTwinGenerators } from "@/content";

export const metadata: Metadata = { title: "Questões infinitas" };

export default function TwinsIndexPage() {
  const groups = getTopics()
    .map((topic) => ({ topic, generators: getTwinGenerators(topic.id) }))
    .filter((g) => g.generators.length > 0);

  return (
    <AppShell nav="estudar">
      <BackLink href="/">Início</BackLink>
      <PageTitle
        eyebrow="Treinar mais"
        title="Questões infinitas"
        intro="Cada molde gera questões novas, com números diferentes a cada vez. Use quando errar uma questão e quiser treinar a mesma ideia até ela ficar natural."
      />
      <p className="rounded-xl border border-line bg-surface p-3.5 text-[15px] text-muted">
        As questões gêmeas são geradas pelo SOMA e conferidas por testes automáticos, mas os textos ainda aguardam
        revisão humana. Elas não entram no caderno de erros.
      </p>

      {groups.map(({ topic, generators }) => (
        <section key={topic.id} className="flex flex-col gap-2.5">
          <SectionTitle>{topic.name}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {generators.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/gemea/${g.id}`}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 hover:border-primary-tint"
                >
                  <span className="text-base font-bold">{g.name}</span>
                  <ChevronRightIcon size={20} className="shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </AppShell>
  );
}

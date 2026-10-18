import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink, PageTitle } from "@/components/ui";
import { TwinTrainer } from "@/components/views/TwinTrainer";
import { getTopic, getTwinGeneratorById, getTwinGenerators } from "@/content";

export function generateStaticParams() {
  return getTwinGenerators().map((g) => ({ molde: g.id }));
}

export async function generateMetadata({ params }: PageProps<"/gemea/[molde]">): Promise<Metadata> {
  const { molde } = await params;
  return { title: `Questões gêmeas: ${getTwinGeneratorById(molde)?.name ?? ""}`.trim() };
}

export default async function TwinPage({ params }: PageProps<"/gemea/[molde]">) {
  const { molde } = await params;
  const generator = getTwinGeneratorById(molde);
  if (!generator) notFound();
  const topic = getTopic(generator.topicId);

  return (
    <AppShell nav="estudar">
      <BackLink href="/gemea">Todas as questões infinitas</BackLink>
      <PageTitle
        eyebrow={`Questões infinitas${topic ? ` · ${topic.name}` : ""}`}
        title={generator.name}
        intro="Mesma ideia, números novos a cada rodada. As contas são geradas e conferidas automaticamente pelo SOMA. Acerte 3 seguidas para mostrar que pegou o jeito."
      />
      <TwinTrainer generatorId={generator.id} topicId={generator.topicId} />
    </AppShell>
  );
}

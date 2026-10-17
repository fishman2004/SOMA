import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink, PageTitle } from "@/components/ui";
import { CardSession } from "@/components/views/CardSession";
import { getFlashcardsForTopic, getTopic, getTopics } from "@/content";

export function generateStaticParams() {
  return getTopics()
    .filter((t) => getFlashcardsForTopic(t.id).length > 0)
    .map((t) => ({ topico: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/cartoes/[topico]">): Promise<Metadata> {
  const { topico } = await params;
  return { title: `Cartões: ${getTopic(topico)?.name ?? "tópico"}` };
}

export default async function TopicCardsPage({ params }: PageProps<"/cartoes/[topico]">) {
  const { topico } = await params;
  const topic = getTopic(topico);
  if (!topic || getFlashcardsForTopic(topic.id).length === 0) notFound();

  return (
    <AppShell>
      <BackLink href={`/estudar/${topic.id}`}>{topic.name}</BackLink>
      <PageTitle
        eyebrow="Cartões de memória"
        title={topic.name}
        intro="Tente lembrar a resposta antes de virar o cartão. O que você esquece volta mais cedo."
      />
      <CardSession topicId={topic.id} />
    </AppShell>
  );
}

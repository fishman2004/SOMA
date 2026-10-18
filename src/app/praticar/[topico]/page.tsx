import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicPractice } from "@/components/views/TopicPractice";
import { getQuestionsForTopic, getTopic, getTopics, isTopicAvailable } from "@/content";

export function generateStaticParams() {
  return getTopics()
    .filter(isTopicAvailable)
    .map((t) => ({ topico: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/praticar/[topico]">): Promise<Metadata> {
  const { topico } = await params;
  return { title: `Praticar ${getTopic(topico)?.name ?? ""}`.trim() };
}

export default async function PracticePage({ params }: PageProps<"/praticar/[topico]">) {
  const { topico } = await params;
  const topic = getTopic(topico);
  if (!topic || !isTopicAvailable(topic)) notFound();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ground md:max-w-2xl">
      <main id="conteudo" className="flex flex-1 flex-col">
        <TopicPractice topicId={topic.id} topicName={topic.name} questions={getQuestionsForTopic(topic.id)} />
      </main>
    </div>
  );
}

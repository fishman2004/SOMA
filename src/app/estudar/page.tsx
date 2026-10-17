import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Chip, PageTitle } from "@/components/ui";
import { TopicStatus } from "@/components/views/TopicStatus";
import { getSubject, getTopics, isTopicAvailable } from "@/content";

export const metadata: Metadata = { title: "Trilha de Matemática" };

export default function TrailPage() {
  const subject = getSubject()!;
  const topics = getTopics(subject.id);

  return (
    <AppShell nav="estudar">
      <PageTitle
        eyebrow={subject.area}
        title={`Trilha de ${subject.name}`}
        intro="Uma ordem sugerida, não obrigatória. Comece por onde fizer sentido para você."
      />

      <ol className="flex flex-col">
        {topics.map((topic, i) => {
          const available = isTopicAvailable(topic);
          const isLast = i === topics.length - 1;
          return (
            <li key={topic.id} className="flex gap-3.5">
              <div className="flex w-8 shrink-0 flex-col items-center" aria-hidden="true">
                <div
                  className={`flex size-8 items-center justify-center rounded-full font-display text-[15px] font-bold ${
                    available ? "bg-primary text-on-strong" : "border-2 border-line-strong bg-surface text-muted"
                  }`}
                >
                  {topic.order}
                </div>
                {!isLast ? <div className="min-h-5 w-0.5 flex-1 bg-line-strong" /> : null}
              </div>
              <Link
                href={`/estudar/${topic.id}`}
                className={`mb-3.5 flex flex-1 flex-col gap-1.5 rounded-2xl bg-surface px-4 py-3.5 hover:border-primary ${
                  available ? "border-2 border-primary-tint" : "border border-line"
                }`}
              >
                <span className="text-[17px] font-bold">{topic.name}</span>
                <span className="text-sm text-muted">{topic.description}</span>
                {available ? <TopicStatus topicId={topic.id} /> : <Chip>Em preparação</Chip>}
              </Link>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}

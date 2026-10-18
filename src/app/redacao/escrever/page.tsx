import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { BackLink, PageTitle, Skeleton } from "@/components/ui";
import { EssayEditor } from "@/components/views/EssayEditor";

export const metadata: Metadata = { title: "Escrever redação" };

export default function WriteEssayPage() {
  return (
    <AppShell nav="estudar">
      <BackLink href="/redacao">Laboratório de redação</BackLink>
      <PageTitle eyebrow="Redação" title="Escrever" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <EssayEditor />
      </Suspense>
    </AppShell>
  );
}

import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { PageTitle } from "@/components/ui";
import { ProgressView } from "@/components/views/ProgressView";

export const metadata: Metadata = { title: "Progresso" };

export default function ProgressPage() {
  return (
    <AppShell nav="progresso">
      <PageTitle
        title="Seu progresso"
        intro="Domínio vem de acertar questões, inclusive dias depois. XP mostra esforço."
      />
      <ProgressView />
    </AppShell>
  );
}

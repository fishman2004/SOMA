import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ExamView } from "@/components/views/ExamView";

export const metadata: Metadata = { title: "Simulado" };

export default function ExamPage() {
  return (
    <AppShell>
      <ExamView />
    </AppShell>
  );
}

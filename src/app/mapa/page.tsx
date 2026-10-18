import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BackLink, PageTitle } from "@/components/ui";
import { SkillMap } from "@/components/views/SkillMap";

export const metadata: Metadata = { title: "Mapa de habilidades" };

export default function SkillMapPage() {
  return (
    <AppShell nav="progresso">
      <BackLink href="/progresso">Progresso</BackLink>
      <PageTitle
        eyebrow="Matemática"
        title="Mapa de habilidades"
        intro="Cada ponto é uma ideia que cai no ENEM. Ela fica firme quando você acerta todas as questões dela ou 3 questões gêmeas seguidas. Toque numa habilidade para treinar."
      />
      <SkillMap />
    </AppShell>
  );
}

import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BackLink, PageTitle } from "@/components/ui";
import { ReviewView } from "@/components/views/ReviewView";

export const metadata: Metadata = {
  title: "Revisão de conteúdo",
  robots: { index: false, follow: false },
};

export default function ContentReviewPage() {
  return (
    <AppShell>
      <BackLink href="/sobre">Sobre o SOMA</BackLink>
      <PageTitle
        eyebrow="Para revisores"
        title="Revisão de conteúdo"
        intro="Confira cada item como se fosse um estudante: o enunciado está claro? O gabarito está certo? A explicação ajuda a entender? Ao terminar, baixe a revisão e envie para quem mantém o SOMA."
      />
      <ReviewView />
    </AppShell>
  );
}

import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BackLink, PageTitle } from "@/components/ui";
import { CardSession } from "@/components/views/CardSession";

export const metadata: Metadata = { title: "Cartões de memória" };

export default function CardsPage() {
  return (
    <AppShell>
      <BackLink href="/">Início</BackLink>
      <PageTitle
        title="Cartões de memória"
        intro="Tente lembrar a resposta antes de virar o cartão. O que você esquece volta mais cedo."
      />
      <CardSession />
    </AppShell>
  );
}

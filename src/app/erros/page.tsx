import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { PageTitle } from "@/components/ui";
import { ErrorsView } from "@/components/views/ErrorsView";

export const metadata: Metadata = { title: "Caderno de erros" };

export default function ErrorsPage() {
  return (
    <AppShell nav="erros">
      <PageTitle
        title="Caderno de erros"
        intro="Cada erro mostra um caminho. Refaça depois de um tempo e veja o que mudou."
      />
      <ErrorsView />
    </AppShell>
  );
}

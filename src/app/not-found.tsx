import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageTitle, buttonPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <AppShell nav="inicio">
      <PageTitle title="Página não encontrada" intro="Esse endereço não existe ou mudou de lugar." />
      <Link href="/" className={buttonPrimary}>
        Voltar ao início
      </Link>
    </AppShell>
  );
}

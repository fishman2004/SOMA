import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { PageTitle, Skeleton } from "@/components/ui";
import { SearchView } from "@/components/views/SearchView";
import { getSearchEntries } from "@/content";

export const metadata: Metadata = { title: "Buscar" };

export default function SearchPage() {
  return (
    <AppShell nav="inicio">
      <PageTitle title="Buscar" />
      <Suspense fallback={<Skeleton className="h-14" />}>
        <SearchView entries={getSearchEntries()} />
      </Suspense>
    </AppShell>
  );
}

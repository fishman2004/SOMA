import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LogoMark, SearchIcon } from "@/components/icons";
import { HomeView } from "@/components/views/HomeView";

const UPCOMING_AREAS = ["Linguagens", "Ciências Humanas", "Ciências da Natureza", "Redação"];

export default function HomePage() {
  return (
    <AppShell nav="inicio">
      <header className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-xl font-bold tracking-[0.08em]">SOMA</span>
        </div>
        <Link
          href="/buscar"
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2 text-[15px] font-bold text-primary hover:bg-surface"
        >
          <SearchIcon size={20} />
          Buscar
        </Link>
      </header>

      <div className="flex flex-col gap-1 pt-2">
        <p className="text-[15px] text-muted">Olá!</p>
        <h1 className="font-display text-[28px] font-bold leading-tight">O que vamos aprender hoje?</h1>
      </div>

      <HomeView />

      <section className="flex flex-col gap-2.5" aria-labelledby="outras-areas">
        <h2 id="outras-areas" className="font-display text-lg font-bold">
          Outras áreas
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {UPCOMING_AREAS.map((area) => (
            <li key={area} className="rounded-[14px] border border-dashed border-line-strong p-3.5 text-sm text-muted">
              {area}
              <br />
              Em breve
            </li>
          ))}
        </ul>
      </section>

      <p className="pt-2 text-center text-sm text-muted">
        <Link href="/sobre" className="inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-2">
          Sobre o SOMA
        </Link>
      </p>
    </AppShell>
  );
}

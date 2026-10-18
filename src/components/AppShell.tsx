import Link from "next/link";
import type { ReactNode } from "react";
import { BookIcon, BookmarkIcon, ChartIcon, HomeIcon, LogoMark, SearchIcon } from "./icons";

export type NavKey = "inicio" | "estudar" | "erros" | "progresso";

const NAV_ITEMS: { key: NavKey; href: string; label: string; Icon: typeof HomeIcon }[] = [
  { key: "inicio", href: "/", label: "Início", Icon: HomeIcon },
  { key: "estudar", href: "/estudar", label: "Estudar", Icon: BookIcon },
  { key: "erros", href: "/erros", label: "Erros", Icon: BookmarkIcon },
  { key: "progresso", href: "/progresso", label: "Progresso", Icon: ChartIcon },
];

function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="sticky bottom-0 z-10 grid h-[72px] shrink-0 grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV_ITEMS.map(({ key, href, label, Icon }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              isActive ? "font-bold text-primary" : "text-muted hover:text-ink"
            }`}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Navegação lateral, só em telas largas (computador e tablet deitado). */
function SideNav({ active }: { active: NavKey }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-52 shrink-0 flex-col gap-8 py-10 md:flex">
      <Link href="/" className="flex items-center gap-2.5 self-start rounded-lg">
        <LogoMark />
        <span className="font-display text-xl font-bold tracking-[0.08em]">SOMA</span>
      </Link>
      <nav aria-label="Navegação principal">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, href, label, Icon }) => {
            const isActive = key === active;
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${
                    isActive ? "bg-primary-soft font-bold text-primary-strong" : "text-muted hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Icon size={22} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link
        href="/buscar"
        className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-3 text-[15px] text-muted hover:border-primary-tint hover:text-ink"
      >
        <SearchIcon size={20} />
        Buscar
      </Link>
      <Link href="/sobre" className="mt-auto inline-flex min-h-11 items-center px-3 text-sm text-muted hover:text-ink">
        Sobre o SOMA
      </Link>
    </aside>
  );
}

/**
 * Moldura de todas as telas. No celular: uma coluna com navegação inferior.
 * Em telas largas: navegação lateral e coluna de leitura mais larga.
 * Opcionalmente, uma barra de ação fixa no rodapé.
 */
export function AppShell({
  children,
  nav,
  footer,
  header,
}: {
  children: ReactNode;
  nav?: NavKey;
  footer?: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="md:flex md:justify-center md:gap-10 md:px-8">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      {nav ? <SideNav active={nav} /> : null}
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ground md:mx-0 md:max-w-2xl">
      {header}
      <main id="conteudo" className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5 md:pb-12 md:pt-10">
        {children}
      </main>
      {footer ? (
        <footer className="sticky bottom-0 z-10 border-t border-line bg-ground px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {footer}
        </footer>
      ) : null}
      {nav ? <BottomNav active={nav} /> : null}
      </div>
    </div>
  );
}

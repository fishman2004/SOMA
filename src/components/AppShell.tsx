import Link from "next/link";
import type { ReactNode } from "react";
import { BookIcon, BookmarkIcon, ChartIcon, HomeIcon } from "./icons";

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
      className="sticky bottom-0 z-10 grid h-[72px] shrink-0 grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
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

/**
 * Moldura de todas as telas: coluna centralizada (pensada primeiro para o
 * celular), conteúdo principal e, opcionalmente, navegação inferior ou uma
 * barra de ação fixa no rodapé.
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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ground md:border-x md:border-line">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      {header}
      <main id="conteudo" className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5">
        {children}
      </main>
      {footer ? (
        <footer className="sticky bottom-0 z-10 border-t border-line bg-ground px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {footer}
        </footer>
      ) : null}
      {nav ? <BottomNav active={nav} /> : null}
    </div>
  );
}

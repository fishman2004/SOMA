import type { Metadata, Viewport } from "next";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "./globals.css";
import { OfflineBanner, ServiceWorkerRegistration } from "@/components/ServiceWorker";

/**
 * Endereço público do site, usado nos links da imagem de compartilhamento.
 * Defina NEXT_PUBLIC_SITE_URL ao publicar (ex.: https://soma.exemplo.com.br).
 * Na Vercel, o endereço de produção do projeto é usado automaticamente.
 */
function siteUrl(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return undefined;
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "SOMA — Sistema de Organização, Memorização e Aprendizagem",
    template: "%s · SOMA",
  },
  description:
    "Plataforma gratuita de estudos para o ENEM: estude, pratique, revise seus erros e acompanhe sua evolução.",
  applicationName: "SOMA",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SOMA",
    title: "SOMA — Estude para o ENEM do jeito que funciona",
    description: "Gratuito, sem cadastro e funciona até sem internet. Aprender, praticar, revisar e evoluir.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#111318" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <OfflineBanner />
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

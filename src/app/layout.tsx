import type { Metadata, Viewport } from "next";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "./globals.css";
import { OfflineBanner, ServiceWorkerRegistration } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: {
    default: "SOMA — Sistema de Organização, Memorização e Aprendizagem",
    template: "%s · SOMA",
  },
  description:
    "Plataforma gratuita de estudos para o ENEM: estude, pratique, revise seus erros e acompanhe sua evolução.",
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

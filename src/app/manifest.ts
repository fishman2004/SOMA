import type { MetadataRoute } from "next";

/** Permite adicionar o SOMA à tela inicial do celular como um app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOMA — Sistema de Organização, Memorização e Aprendizagem",
    short_name: "SOMA",
    description: "Estude para o ENEM: pratique, revise seus erros e acompanhe sua evolução.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f0",
    theme_color: "#f4f5f0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

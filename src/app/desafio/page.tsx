import type { Metadata } from "next";
import { DailyChallenge } from "@/components/views/DailyChallenge";

export const metadata: Metadata = { title: "Desafio do dia" };

export default function DailyPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ground md:max-w-2xl">
      <main id="conteudo" className="flex flex-1 flex-col">
        <DailyChallenge />
      </main>
    </div>
  );
}

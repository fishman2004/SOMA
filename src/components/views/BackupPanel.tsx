"use client";

import { useRef, useState } from "react";
import { backupFileName, parseBackup, serializeBackup } from "@/lib/backup";
import { useProgress } from "@/lib/progress-store";
import { Card, SectionTitle, buttonSecondary } from "../ui";

/**
 * Baixar e restaurar uma cópia do progresso. Tudo acontece no aparelho:
 * o arquivo não é enviado para lugar nenhum.
 */
export function BackupPanel() {
  const { state, replace, reset } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function download() {
    const blob = new Blob([serializeBackup(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: "ok", text: "Cópia baixada. Guarde o arquivo para restaurar em outro aparelho." });
  }

  async function restore(file: File) {
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      return;
    }
    const answers = result.state.attempts.length;
    const ok = window.confirm(
      `Restaurar esta cópia (${answers} ${answers === 1 ? "resposta" : "respostas"})? Ela substitui o progresso atual deste navegador.`,
    );
    if (!ok) return;
    replace(result.state);
    setMessage({ tone: "ok", text: "Progresso restaurado." });
  }

  return (
    <Card className="gap-3 p-[18px]">
      <SectionTitle>Seus dados</SectionTitle>
      <p className="text-[15px] leading-relaxed text-muted">
        Seu progresso fica salvo só neste navegador. Nenhum dado pessoal é enviado. Para trocar de aparelho ou não
        perder nada ao limpar o navegador, baixe uma cópia.
      </p>
      <div className="grid gap-2 min-[400px]:grid-cols-2">
        <button type="button" className={buttonSecondary} onClick={download}>
          Baixar cópia
        </button>
        <button type="button" className={buttonSecondary} onClick={() => fileRef.current?.click()}>
          Restaurar cópia
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void restore(file);
        }}
      />
      <p role="status" className={`text-sm ${message?.tone === "error" ? "font-bold text-error-strong" : "text-success-strong"}`}>
        {message?.text ?? ""}
      </p>
      <button
        type="button"
        onClick={() => {
          if (window.confirm("Apagar todo o seu progresso neste navegador? Isso não pode ser desfeito.")) reset();
        }}
        className="inline-flex min-h-11 items-center self-start text-sm font-bold text-error-strong underline underline-offset-2"
      >
        Apagar meu progresso
      </button>
    </Card>
  );
}

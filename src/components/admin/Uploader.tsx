"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import styles from "@/app/admin/admin.module.css";

export type Uploaded = { url: string; kind: "image" | "video"; name: string };

/**
 * Glisser-déposer ou choisir des fichiers. Envoi direct vers Vercel Blob (ou public/uploads en local),
 * puis `onDone` enregistre les adresses (action serveur). Vidéos lourdes acceptées (envoi en plusieurs parties).
 */
export default function Uploader({
  blob,
  accept = "image/*,video/*",
  multiple = true,
  label = "Glisse tes photos et vidéos ici, ou clique pour choisir",
  onDone,
}: {
  blob: boolean;
  accept?: string;
  multiple?: boolean;
  label?: string;
  onDone: (files: Uploaded[]) => Promise<void> | void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<{ name: string; pct: number; i: number; n: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (list: FileList | File[]) => {
    const files = Array.from(list).filter((f) => /^(image|video)\//.test(f.type));
    if (!files.length) return;
    setError(null);
    const done: Uploaded[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setBusy({ name: f.name, pct: 0, i: i + 1, n: files.length });
        let url: string;
        if (blob) {
          const r = await upload(`site/${f.name}`, f, {
            access: "public",
            handleUploadUrl: "/api/admin/upload",
            multipart: f.size > 50 * 1024 * 1024,
            onUploadProgress: (p) => setBusy({ name: f.name, pct: p.percentage, i: i + 1, n: files.length }),
          });
          url = r.url;
        } else {
          const fd = new FormData();
          fd.append("file", f);
          const res = await fetch("/api/admin/upload-local", { method: "POST", body: fd });
          if (!res.ok) throw new Error(`Envoi refusé (${res.status})`);
          url = ((await res.json()) as { url: string }).url;
        }
        done.push({ url, kind: f.type.startsWith("video/") ? "video" : "image", name: f.name });
      }
      await onDone(done);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || "L'envoi a échoué.");
      if (done.length) {
        await onDone(done);
        router.refresh();
      }
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <div
        className={styles.drop}
        data-over={over}
        role="button"
        tabIndex={0}
        onClick={() => !busy && input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!busy) void send(e.dataTransfer.files);
        }}
      >
        {busy ? (
          <>
            <span>
              Envoi {busy.i}/{busy.n} — {busy.name}
            </span>
            <span className={styles.progress}>
              <i style={{ width: `${busy.pct}%` }} />
            </span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </div>
      <input ref={input} type="file" accept={accept} multiple={multiple} hidden onChange={(e) => e.target.files && void send(e.target.files)} />
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

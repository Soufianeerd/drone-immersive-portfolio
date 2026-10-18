"use client";

import { mediaAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";
import Uploader, { type Uploaded } from "./Uploader";

type M = { id: number; kind: string; url: string; caption: string };

/** Fichiers d'une collection : envoi, ordre, couverture, légende, suppression. */
export default function MediaManager({ items, coverId, blob, add }: { items: M[]; coverId: number | null; blob: boolean; add: (f: Uploaded[]) => Promise<void> }) {
  return (
    <>
      <Uploader blob={blob} onDone={add} />
      {items.length ? (
        <div className={styles.mediaGrid} style={{ marginTop: 16 }}>
          {items.map((m, i) => (
            <div key={m.id} className={styles.mediaItem} data-cover={m.id === coverId}>
              {m.kind === "video" ? (
                <video className={styles.thumb} src={`${m.url}#t=0.1`} muted playsInline preload="metadata" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.thumb} src={m.url} alt={m.caption} loading="lazy" />
              )}
              <form action={mediaAction} style={{ padding: "6px 6px 0" }}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="op" value="caption" />
                <input className={styles.input} name="caption" defaultValue={m.caption} placeholder="Légende…" style={{ padding: "5px 8px", fontSize: 12 }} onBlur={(e) => e.currentTarget.form?.requestSubmit()} />
              </form>
              <div className={styles.mediaTools}>
                {(
                  [
                    ["up", "←", i === 0],
                    ["down", "→", i === items.length - 1],
                    ["cover", m.id === coverId ? "Couverture ✓" : "Mettre en couverture", m.id === coverId],
                  ] as const
                ).map(([op, label, disabled]) => (
                  <form key={op} action={mediaAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="op" value={op} />
                    <button className={`${styles.btnGhost} ${styles.btnSmall}`} disabled={disabled}>
                      {label}
                    </button>
                  </form>
                ))}
                <form
                  action={mediaAction}
                  onSubmit={(e) => {
                    if (!window.confirm("Retirer ce fichier ?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="op" value="delete" />
                  <button className={`${styles.btnDanger} ${styles.btnSmall}`}>Retirer</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

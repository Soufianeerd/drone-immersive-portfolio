"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";
import Uploader from "./Uploader";

/** Un champ « fichier » : aperçu + envoi + adresse modifiable. La valeur part avec le formulaire (input caché). */
export default function MediaField({
  name,
  defaultValue,
  blob,
  accept = "image/*,video/*",
  label,
}: {
  name: string;
  defaultValue?: string | null;
  blob: boolean;
  accept?: string;
  label: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
  return (
    <div className={styles.field}>
      <span>{label}</span>
      {url ? (
        isVideo ? (
          <video className={styles.preview} src={url} muted loop autoPlay playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.preview} src={url} alt="" />
        )
      ) : null}
      <Uploader blob={blob} accept={accept} multiple={false} label="Glisse un fichier ici, ou clique pour choisir" onDone={(f) => setUrl(f[0]?.url ?? url)} />
      <div className={styles.row}>
        <input className={styles.input} style={{ flex: 1 }} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="ou colle une adresse (https://…)" />
        {url ? (
          <button type="button" className={`${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setUrl("")}>
            Retirer
          </button>
        ) : null}
      </div>
      <input type="hidden" name={name} value={url} />
    </div>
  );
}

"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";
import type { SiteBackground } from "@/lib/cms/types";
import MediaField from "./MediaField";

export default function BackgroundEditor({ initial, blob }: { initial: SiteBackground; blob: boolean }) {
  const [type, setType] = useState(initial.type);
  return (
    <>
      <div className={styles.row} style={{ gap: 18, marginBottom: 14 }}>
        {(
          [
            ["world", "Paysage vivant (montagnes, heure et météo réelles)"],
            ["image", "Une photo"],
            ["video", "Une vidéo"],
          ] as const
        ).map(([v, l]) => (
          <label key={v} className={styles.check}>
            <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} />
            {l}
          </label>
        ))}
      </div>
      {type === "image" ? <MediaField name="url" label="Photo de fond" accept="image/*" blob={blob} defaultValue={initial.type === "image" ? initial.url : ""} /> : null}
      {type === "video" ? (
        <>
          <MediaField name="url" label="Vidéo de fond (courte, sans son)" accept="video/*" blob={blob} defaultValue={initial.type === "video" ? initial.url : ""} />
          <div className={styles.row} style={{ gap: 18, marginBottom: 12 }}>
            <label className={styles.check}>
              <input type="radio" name="mode" value="loop" defaultChecked={initial.type !== "video" || initial.mode === "loop"} />
              En boucle
            </label>
            <label className={styles.check}>
              <input type="radio" name="mode" value="boomerang" defaultChecked={initial.type === "video" && initial.mode === "boomerang"} />
              Boomerang (aller-retour)
            </label>
          </div>
        </>
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import styles from "@/app/admin/admin.module.css";
import { SECTION_LABELS, type SiteSettings } from "@/lib/cms/types";

/** Ordre et visibilité des sections de la page d'accueil (le hero reste toujours en premier). */
export default function SectionsEditor({ initial }: { initial: SiteSettings["sections"] }) {
  const [items, setItems] = useState(initial);
  const move = (i: number, d: -1 | 1) =>
    setItems((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const n = [...s];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  return (
    <div className={styles.sections}>
      <div className={styles.sectionRow} style={{ opacity: 0.7 }}>
        <span className={styles.badge}>1</span>
        <span>
          <b>Accueil (setup FPV + nom)</b> — toujours en premier
        </span>
      </div>
      {items.map((s, i) => (
        <div key={s.key} className={styles.sectionRow} data-hidden={!s.visible}>
          <span className={styles.badge}>{i + 2}</span>
          <label className={styles.row} style={{ gap: 8 }}>
            <b style={{ minWidth: 150 }}>{SECTION_LABELS[s.key]}</b>
            <input
              className={styles.input}
              style={{ maxWidth: 220 }}
              name={`label_${s.key}`}
              defaultValue={s.label}
              aria-label="Nom dans le menu"
              title="Nom dans le menu"
            />
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              name={`visible_${s.key}`}
              checked={s.visible}
              onChange={(e) => setItems((all) => all.map((x) => (x.key === s.key ? { ...x, visible: e.target.checked } : x)))}
            />
            Visible
          </label>
          <span className={styles.row} style={{ gap: 4 }}>
            <button type="button" className={`${styles.btnGhost} ${styles.btnSmall}`} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">
              ↑
            </button>
            <button type="button" className={`${styles.btnGhost} ${styles.btnSmall}`} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descendre">
              ↓
            </button>
          </span>
        </div>
      ))}
      <input type="hidden" name="order" value={items.map((s) => s.key).join(",")} />
    </div>
  );
}
